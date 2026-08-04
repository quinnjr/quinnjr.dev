import 'reflect-metadata';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { initializeContainer } from '../../../src/server/container';
import { schema } from '../../../src/server/graphql/schema';
import {
  AUTH_LIMITS,
  AUTH_LIMIT_OVERRIDES_ENV,
  applyAuthLimitOverridesFromEnv,
  configureAuthLimits,
  createYogaMiddleware,
  resetAuthLimits,
} from '../../../src/server/graphql/yoga';

const ORIGINAL_NODE_ENV = process.env['NODE_ENV'];

afterEach(() => {
  process.env['NODE_ENV'] = ORIGINAL_NODE_ENV;
  // AUTH_LIMITS is module state shared by every test in this file, and the
  // coverage/enforcement suites below assert against the shipped values.
  resetAuthLimits();
  vi.restoreAllMocks();
});

function graphiqlRequest(handler: ReturnType<typeof createYogaMiddleware>) {
  return handler.fetch('http://localhost/graphql', {
    method: 'GET',
    headers: { accept: 'text/html' },
  });
}

describe('yoga middleware', () => {
  it('answers a POST /graphql request with 200 and a data payload', async () => {
    initializeContainer();
    const handler = createYogaMiddleware();

    const response = await handler.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data?: unknown; errors?: unknown };
    expect(body.errors).toBeUndefined();
    expect(body.data).toEqual({ __typename: 'Query' });
  });

  it('serves GraphiQL outside production', async () => {
    process.env['NODE_ENV'] = 'development';
    initializeContainer();

    const response = await graphiqlRequest(createYogaMiddleware());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  it('disables GraphiQL when NODE_ENV=production', async () => {
    process.env['NODE_ENV'] = 'production';
    initializeContainer();

    const response = await graphiqlRequest(createYogaMiddleware());

    expect(response.headers.get('content-type') ?? '').not.toContain('text/html');
    expect(await response.text()).not.toContain('<!DOCTYPE html>');
  });
});

/**
 * Reads the `authScopes` Pothos recorded on each built mutation field. Going
 * through the schema rather than a hand-kept list is the whole point: a new
 * public mutation shows up here the moment it is defined, with no second place
 * to remember to update.
 */
function publicMutationNames(): string[] {
  const mutation = schema.getMutationType();
  if (!mutation) {
    throw new Error('schema has no Mutation type');
  }
  return Object.entries(mutation.getFields())
    .filter(([, field]) => {
      const options = (
        field.extensions as { pothosOptions?: { authScopes?: Record<string, unknown> } }
      ).pothosOptions;
      return options?.authScopes?.['public'] === true;
    })
    .map(([name]) => name)
    .sort();
}

describe('rate-limit policy coverage', () => {
  // `useAuthRateLimit` claims a new auth mutation "cannot be added without a
  // conscious decision here". That was untrue until this test existed — the two
  // enrolment mutations shipped public and unthrottled. This is what makes the
  // claim mechanical rather than aspirational.
  it('has a policy for every mutation reachable without a session', () => {
    expect([...AUTH_LIMITS.keys()].sort()).toEqual(publicMutationNames());
  });

  // The converse: a policy for a field that is not actually public is dead
  // configuration, and reads as protection that is not doing anything.
  it('has no policy for a mutation that is not public', () => {
    const publicNames = new Set(publicMutationNames());
    expect([...AUTH_LIMITS.keys()].filter(name => !publicNames.has(name))).toEqual([]);
  });
});

describe('rate limiting through the middleware', () => {
  // Names what is asserted: that the 11th attempt from one address is refused.
  // It does NOT assert the plugin's stronger claim that the cost is rejected
  // before any database or Argon2 work is scheduled — proving that needs a
  // resolver spy the middleware gives no seam for, and asserting it from the
  // absence of a Prisma error would only hold on a machine with no database.
  it('refuses login past the IP limit', async () => {
    initializeContainer();
    const handler = createYogaMiddleware();

    const attempt = (index: number) =>
      handler.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // A distinct email per attempt, so only the IP bucket can be what
          // rejects — the per-subject bucket never accumulates.
          'x-forwarded-for': '203.0.113.7',
        },
        body: JSON.stringify({
          query: `mutation { login(email: "u${index}@b.com", password: "pw") { token } }`,
        }),
      });

    const codes: string[] = [];
    for (let index = 0; index < 12; index++) {
      const body = (await (await attempt(index)).json()) as {
        errors?: Array<{ extensions?: { code?: string } }>;
      };
      codes.push(body.errors?.[0]?.extensions?.code ?? 'OK');
    }

    // The configured ipLimit for `login` is 10.
    expect(codes.slice(0, 10)).not.toContain('TOO_MANY_REQUESTS');
    expect(codes.slice(10)).toEqual(['TOO_MANY_REQUESTS', 'TOO_MANY_REQUESTS']);
  });

  // The client reads `code` and `retryAfterSeconds` off this response to tell a
  // throttled attempt apart from a wrong password (see
  // src/app/graphql/rate-limit-error.ts). Yoga's production masking rewrites
  // unexpected errors into a bare "Unexpected error", so this asserts the
  // throttle survives it — without this, masking could silently flatten the
  // response and the sign-in form would go back to blaming the password.
  it('reports the throttle code and retry hint even under production masking', async () => {
    process.env['NODE_ENV'] = 'production';
    initializeContainer();
    const handler = createYogaMiddleware();

    const attempt = () =>
      handler.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.200' },
        body: JSON.stringify({
          query: 'mutation { login(email: "masked@b.com", password: "pw") { token } }',
        }),
      });

    let body!: {
      errors?: Array<{
        message?: string;
        extensions?: { code?: string; retryAfterSeconds?: number };
      }>;
    };
    // Six attempts: the per-subject limit for one email is 5.
    for (let index = 0; index < 6; index++) {
      body = (await (await attempt()).json()) as typeof body;
    }

    const error = body.errors?.[0];
    expect(error?.extensions?.code).toBe('TOO_MANY_REQUESTS');
    expect(error?.message).toBe('Too many attempts. Please try again later.');
    // A usable hint, and whole seconds only — a high-resolution countdown would
    // leak how far into the window the account already was.
    expect(error?.extensions?.retryAfterSeconds).toBeGreaterThan(0);
    expect(Number.isInteger(error?.extensions?.retryAfterSeconds)).toBe(true);
  });

  it('keys the IP bucket on the forwarded address, not one global counter', async () => {
    initializeContainer();
    const handler = createYogaMiddleware();

    const attempt = (address: string) =>
      handler.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': address },
        body: JSON.stringify({
          query: 'mutation { login(email: "a@b.com", password: "pw") { token } }',
        }),
      });

    // Exhaust the per-subject bucket for this email from one address (limit 5),
    // then prove a different address is still refused: the subject bucket is
    // what survives IP rotation, which is the property it exists for.
    for (let index = 0; index < 5; index++) {
      await attempt('198.51.100.1');
    }
    const body = (await (await attempt('198.51.100.2')).json()) as {
      errors?: Array<{ extensions?: { code?: string } }>;
    };

    expect(body.errors?.[0]?.extensions?.code).toBe('TOO_MANY_REQUESTS');
  });
});

describe('configurable auth rate limits', () => {
  /** Silence the deliberate rejection messages and let a test read them back. */
  function captureErrors() {
    return vi.spyOn(console, 'error').mockImplementation(() => undefined);
  }

  it('applies an override and enforces the new limit end to end', async () => {
    // The property under test, stated in terms of behaviour rather than of the
    // map's contents: an override actually changes what the middleware refuses.
    expect(configureAuthLimits({ login: { ipLimit: 2, subjectLimit: 2 } })).toBe(true);

    initializeContainer();
    const handler = createYogaMiddleware();
    const attempt = (index: number) =>
      handler.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.10' },
        body: JSON.stringify({
          query: `mutation { login(email: "o${index}@b.com", password: "pw") { token } }`,
        }),
      });

    const codes: string[] = [];
    for (let index = 0; index < 3; index++) {
      const body = (await (await attempt(index)).json()) as {
        errors?: Array<{ extensions?: { code?: string } }>;
      };
      codes.push(body.errors?.[0]?.extensions?.code ?? 'OK');
    }

    // Default ipLimit is 10, so a third refusal can only come from the override.
    expect(codes).toEqual(['OK', 'OK', 'TOO_MANY_REQUESTS']);
  });

  it('leaves fields it was not given alone', () => {
    configureAuthLimits({ login: { ipLimit: 99 } });

    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(99);
    // Untouched keys keep their shipped values rather than becoming undefined.
    expect(AUTH_LIMITS.get('login')?.subjectLimit).toBe(5);
    expect(AUTH_LIMITS.get('verifyPasskey')?.ipLimit).toBe(15);
  });

  it('restores the shipped policy on reset', () => {
    configureAuthLimits({ login: { ipLimit: 1 } });
    resetAuthLimits();

    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(10);
  });

  it('refuses an unknown field name rather than silently doing nothing', () => {
    const errors = captureErrors();

    // A typo'd mutation name is the failure this rejects: it would otherwise
    // look identical to a working override that simply had no effect.
    expect(configureAuthLimits({ signIn: { ipLimit: 100 } })).toBe(false);
    expect(errors.mock.calls[0]?.[0]).toContain('unknown rate-limited field "signIn"');
  });

  it.each([
    ['subjectArg', { login: { subjectArg: 'password' } }],
    ['cpuBound', { login: { cpuBound: false } }],
  ])('refuses to override the structural field %s', (_label, overrides) => {
    captureErrors();

    expect(configureAuthLimits(overrides)).toBe(false);
    expect(AUTH_LIMITS.get('login')?.subjectArg).toBe('email');
    expect(AUTH_LIMITS.get('login')?.cpuBound).toBe(true);
  });

  it.each([
    ['a negative count', { login: { ipLimit: -1 } }],
    ['a fractional count', { login: { ipLimit: 1.5 } }],
    ['a string', { login: { ipLimit: '100' } }],
    ['a zero window', { login: { windowMs: 0 } }],
    ['a non-object body', { login: 100 }],
  ])('refuses %s', (_label, overrides) => {
    captureErrors();

    expect(configureAuthLimits(overrides)).toBe(false);
    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(10);
  });

  it('allows a limit of zero, so the throttled branch is reachable in a test', () => {
    expect(configureAuthLimits({ login: { ipLimit: 0 } })).toBe(true);
    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(0);
  });

  it('applies nothing when any entry is invalid', () => {
    captureErrors();

    // All-or-nothing. A half-applied payload is the worst outcome: the part
    // that did nothing is indistinguishable from the part that worked.
    expect(configureAuthLimits({ login: { ipLimit: 50 }, verifyPasskey: { ipLimit: -3 } })).toBe(
      false
    );
    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(10);
  });
});

describe('auth rate limit overrides from the environment', () => {
  function captureErrors() {
    return vi.spyOn(console, 'error').mockImplementation(() => undefined);
  }

  it('reads and applies JSON overrides', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const applied = applyAuthLimitOverridesFromEnv({
      [AUTH_LIMIT_OVERRIDES_ENV]: '{"login":{"ipLimit":1000,"subjectLimit":1000}}',
    });

    expect(applied).toBe(true);
    expect(AUTH_LIMITS.get('login')?.subjectLimit).toBe(1000);
  });

  it('does nothing when the variable is absent or blank', () => {
    expect(applyAuthLimitOverridesFromEnv({})).toBe(false);
    expect(applyAuthLimitOverridesFromEnv({ [AUTH_LIMIT_OVERRIDES_ENV]: '  ' })).toBe(false);
    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(10);
  });

  // The one that matters: a relaxed limit reaching production is the whole risk
  // this feature introduces, so the guard is asserted rather than assumed.
  it('refuses to relax limits under NODE_ENV=production', () => {
    const errors = captureErrors();

    const applied = applyAuthLimitOverridesFromEnv({
      NODE_ENV: 'production',
      [AUTH_LIMIT_OVERRIDES_ENV]: '{"login":{"ipLimit":1000}}',
    });

    expect(applied).toBe(false);
    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(10);
    expect(errors.mock.calls[0]?.[0]).toContain('not overridable in production');
  });

  it.each([
    ['malformed JSON', 'not json'],
    ['a JSON array', '[{"login":{"ipLimit":1000}}]'],
    ['a JSON scalar', '42'],
  ])('falls back to the shipped limits on %s', (_label, raw) => {
    captureErrors();

    expect(applyAuthLimitOverridesFromEnv({ [AUTH_LIMIT_OVERRIDES_ENV]: raw })).toBe(false);
    expect(AUTH_LIMITS.get('login')?.ipLimit).toBe(10);
  });
});

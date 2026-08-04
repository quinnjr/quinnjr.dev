import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import 'reflect-metadata';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { initializeContainer } from '../../../src/server/container';
import { schema } from '../../../src/server/graphql/schema';
import {
  authLimits,
  AUTH_LIMIT_OVERRIDES_ENV,
  applyAuthLimitOverridesFromEnv,
  clientAddress,
  configureAuthLimits,
  createYogaMiddleware,
  resetAuthLimits,
} from '../../../src/server/graphql/yoga';

const ORIGINAL_NODE_ENV = process.env['NODE_ENV'];

afterEach(() => {
  process.env['NODE_ENV'] = ORIGINAL_NODE_ENV;
  // The active limit map is module state shared by every test in this file, and
  // the coverage/enforcement suites below assert against the shipped values.
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
function unguardedMutationNames(): string[] {
  const mutation = schema.getMutationType();
  if (!mutation) {
    throw new Error('schema has no Mutation type');
  }
  const names = Object.entries(mutation.getFields())
    .filter(([, field]) => {
      const scopes = (field.extensions as { pothosOptions?: { authScopes?: unknown } })
        .pothosOptions?.authScopes;

      // No `authScopes` at all. `builder.ts` sets no default strategy, so an
      // unannotated field is reachable without a session — and this is the
      // likeliest way to add one by accident, since it is an omission rather
      // than a wrong value. Matching only `public === true` meant such a field
      // was both unauthenticated AND invisible to this check.
      if (scopes === undefined) {
        return true;
      }
      // Function form (`authScopes: (parent, args, ctx) => …`), already used in
      // graphql/types/index.ts. Not statically decidable, so treated as
      // unguarded: a policy is cheap, and a missing one is not.
      if (typeof scopes === 'function') {
        return true;
      }
      return (scopes as Record<string, unknown>)['public'] === true;
    })
    .map(([name]) => name)
    .sort();

  // A guard on the guard. If the extensions shape ever changes — a Pothos
  // upgrade renaming `pothosOptions`, say — every field would read as guarded,
  // this list would be empty, and the coverage assertion below would quietly
  // compare two empty sets and pass while enforcing nothing.
  if (names.length === 0) {
    throw new Error(
      'No unguarded mutations found. Expected at least `login`; the extensions shape Pothos records has probably changed.'
    );
  }
  return names;
}

/**
 * The bucket key. This had no behavioural coverage at all: `trust-proxy.test.ts`
 * tested only the env parser, and every rate-limit test drove the middleware
 * through a header, so deleting the `req.ip` branch — the entire point of the
 * change — failed nothing.
 */
describe('clientAddress', () => {
  it('uses req.ip, which trust proxy resolves from the trusted end of the chain', () => {
    expect(clientAddress({ req: { ip: '203.0.113.5' } })).toBe('203.0.113.5');
  });

  // The forgeable branch, gone rather than kept as a fallback. Reading the
  // leftmost X-Forwarded-For entry took the client's own claim, so rotating the
  // header minted a fresh bucket per request. A fallback selected by the shape
  // of the data would have restored that silently whenever `req` was absent.
  it('ignores X-Forwarded-For entirely', () => {
    const forged = {
      request: { headers: new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }) },
      req: { ip: '203.0.113.5' },
    };

    expect(clientAddress(forged)).toBe('203.0.113.5');
    expect(clientAddress({ request: forged.request })).toBe('unknown');
  });

  // A value that is not an IP cannot become a bucket key: it would either
  // collide with other junk or partition the limiter into unbounded buckets.
  it.each([['not-an-ip'], [''], ['203.0.113.5, 1.2.3.4'], ['<script>']])(
    'falls back rather than keying on the non-IP value %j',
    ip => {
      expect(clientAddress({ req: { ip, socket: { remoteAddress: '198.51.100.9' } } })).toBe(
        '198.51.100.9'
      );
    }
  );

  it('falls back to the socket address, then to a single shared bucket', () => {
    expect(clientAddress({ req: { socket: { remoteAddress: '198.51.100.9' } } })).toBe(
      '198.51.100.9'
    );
    expect(clientAddress({ req: {} })).toBe('unknown');
    expect(clientAddress(null)).toBe('unknown');
    expect(clientAddress(undefined)).toBe('unknown');
  });
});

describe('rate-limit policy coverage', () => {
  // `usePublicMutationRateLimit` claims a new public mutation "cannot be added
  // without a conscious decision here". That was untrue until this test existed
  // — the two enrolment mutations shipped public and unthrottled. This is what
  // makes the claim mechanical rather than aspirational.
  //
  // One assertion, not two: an earlier version also asserted "no policy for a
  // non-public mutation", which a set EQUALITY already implies in both
  // directions. It could not fail unless this one had already failed, so it
  // read as a second independent guard while adding no signal.
  it('has a policy for exactly the mutations reachable without a session', () => {
    expect(authLimits.names().sort()).toEqual(unguardedMutationNames());
  });
});

/**
 * Post a GraphQL document as if it arrived from `address`.
 *
 * The address is supplied as `req.ip` on the server context, NOT as an
 * X-Forwarded-For header. That is deliberate: `clientAddress` reads `req.ip`
 * and nothing else, because trusting the header directly was the forgeable
 * behaviour that made the per-IP bucket decorative. Tests that set the header
 * instead were exercising a branch production no longer has, and would keep
 * passing if the real one broke.
 */
function post(
  handler: ReturnType<typeof createYogaMiddleware>,
  query: string,
  address: string
): Promise<Response> {
  // `fetch` is typed `MaybePromise<Response>`; every caller awaits it.
  return Promise.resolve(
    handler.fetch(
      new URL('http://localhost/graphql'),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query }),
      },
      // `clientAddress` reads exactly two fields off the request. Constructing a
      // real `Socket` to satisfy the full Express type would add ~90 members that
      // nothing here touches, so the stub is cast at this one boundary instead.
      { req: { ip: address, socket: { remoteAddress: address } } } as unknown as {
        req: ExpressRequest;
        res: ExpressResponse;
      }
    )
  );
}

/** Error codes from N sequential attempts, `'OK'` where a request carried no
 *  error code at all. */
async function codesFor(
  handler: ReturnType<typeof createYogaMiddleware>,
  query: (index: number) => string,
  address: string,
  attempts: number
): Promise<string[]> {
  const codes: string[] = [];
  for (let index = 0; index < attempts; index++) {
    const body = (await (await post(handler, query(index), address)).json()) as {
      errors?: Array<{ extensions?: { code?: string } }>;
    };
    codes.push(body.errors?.[0]?.extensions?.code ?? 'OK');
  }
  return codes;
}

describe('rate limiting through the middleware', () => {
  // Names what is asserted: that the 11th attempt from one address is refused.
  // It does NOT assert the plugin's stronger claim that the cost is rejected
  // before any database or Argon2 work is scheduled — proving that needs a
  // resolver spy the middleware gives no seam for, and asserting it from the
  // absence of a Prisma error would only hold on a machine with no database.
  it('refuses login past the IP limit', async () => {
    initializeContainer();

    // A distinct email per attempt, so only the IP bucket can be what rejects —
    // the per-subject bucket never accumulates.
    const codes = await codesFor(
      createYogaMiddleware(),
      index => `mutation { login(email: "u${index}@b.com", password: "pw") { token } }`,
      '203.0.113.7',
      12
    );

    // The configured ipLimit for `login` is 10.
    expect(codes.slice(0, 10)).not.toContain('TOO_MANY_REQUESTS');
    expect(codes.slice(10)).toEqual(['TOO_MANY_REQUESTS', 'TOO_MANY_REQUESTS']);
  });

  // The bypass this plugin shipped with: the operation's selection set can
  // contain no FIELD node at all and still execute `login`. Walking only direct
  // FIELD selections meant `limitedFields` returned empty, `onExecute` returned
  // early, and every bucket — plus the Argon2id concurrency gate — was skipped.
  // Asserted through the middleware rather than against `limitedFields` so it
  // measures what an attacker actually gets.
  it.each([
    [
      'a named fragment spread',
      (index: number) =>
        `mutation { ...L } fragment L on Mutation { login(email: "f${index}@b.com", password: "pw") { token } }`,
    ],
    [
      'an inline fragment',
      (index: number) =>
        `mutation { ... on Mutation { login(email: "i${index}@b.com", password: "pw") { token } } }`,
    ],
    [
      'a fragment nested inside a fragment',
      (index: number) =>
        `mutation { ...Outer } fragment Outer on Mutation { ...Inner } fragment Inner on Mutation { login(email: "n${index}@b.com", password: "pw") { token } }`,
    ],
  ])('throttles login reached through %s', async (label, query) => {
    initializeContainer();
    // A distinct address per case, so the three cases cannot pool one bucket
    // and pass on each other's rejections.
    const codes = await codesFor(
      createYogaMiddleware(),
      query,
      `198.51.100.${10 + label.length}`,
      12
    );

    expect(codes).toContain('TOO_MANY_REQUESTS');
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
      post(
        handler,
        'mutation { login(email: "masked@b.com", password: "pw") { token } }',
        '203.0.113.200'
      );

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

  it('keys the subject bucket on the email, so rotating the address does not help', async () => {
    initializeContainer();
    const handler = createYogaMiddleware();

    const attempt = (address: string) =>
      post(handler, 'mutation { login(email: "a@b.com", password: "pw") { token } }', address);

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
    const codes = await codesFor(
      createYogaMiddleware(),
      index => `mutation { login(email: "o${index}@b.com", password: "pw") { token } }`,
      '192.0.2.10',
      3
    );

    // Asserts only the throttling, not the outcome of the first two attempts.
    // `codesFor` reports any error carrying no `extensions.code` as 'OK', so
    // `toEqual(['OK','OK','TOO_MANY_REQUESTS'])` silently also asserted "the
    // first two failed in some uncategorised way" — which held only on a
    // machine where the test database was unreachable and a Prisma connection
    // error was the uncoded failure. With a database present those attempts
    // reach the resolver and return UNAUTHENTICATED, and the test broke.
    // Default ipLimit is 10, so a third refusal can only come from the override.
    expect(codes.slice(0, 2)).not.toContain('TOO_MANY_REQUESTS');
    expect(codes[2]).toBe('TOO_MANY_REQUESTS');
  });

  it('leaves fields it was not given alone', () => {
    configureAuthLimits({ login: { ipLimit: 99 } });

    expect(authLimits.get('login')?.ipLimit).toBe(99);
    // Untouched keys keep their shipped values rather than becoming undefined.
    expect(authLimits.get('login')?.subjectLimit).toBe(5);
    expect(authLimits.get('verifyPasskey')?.ipLimit).toBe(15);
  });

  it('restores the shipped policy on reset', () => {
    configureAuthLimits({ login: { ipLimit: 1 } });
    resetAuthLimits();

    expect(authLimits.get('login')?.ipLimit).toBe(10);
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
    expect(authLimits.get('login')?.subjectArg).toBe('email');
    expect(authLimits.get('login')?.cpuBound).toBe(true);
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
    expect(authLimits.get('login')?.ipLimit).toBe(10);
  });

  it('allows a limit of zero, so the throttled branch is reachable in a test', () => {
    expect(configureAuthLimits({ login: { ipLimit: 0 } })).toBe(true);
    expect(authLimits.get('login')?.ipLimit).toBe(0);
  });

  it('applies nothing when any entry is invalid', () => {
    captureErrors();

    // All-or-nothing. A half-applied payload is the worst outcome: the part
    // that did nothing is indistinguishable from the part that worked.
    expect(configureAuthLimits({ login: { ipLimit: 50 }, verifyPasskey: { ipLimit: -3 } })).toBe(
      false
    );
    expect(authLimits.get('login')?.ipLimit).toBe(10);
  });
});

describe('auth rate limit overrides from the environment', () => {
  function captureErrors() {
    return vi.spyOn(console, 'error').mockImplementation(() => undefined);
  }

  it('reads and applies JSON overrides', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const applied = applyAuthLimitOverridesFromEnv({
      NODE_ENV: 'development',
      [AUTH_LIMIT_OVERRIDES_ENV]: '{"login":{"ipLimit":1000,"subjectLimit":1000}}',
    });

    expect(applied).toBe(true);
    expect(authLimits.get('login')?.subjectLimit).toBe(1000);
  });

  it('does nothing when the variable is absent or blank', () => {
    expect(applyAuthLimitOverridesFromEnv({})).toBe(false);
    expect(applyAuthLimitOverridesFromEnv({ [AUTH_LIMIT_OVERRIDES_ENV]: '  ' })).toBe(false);
    expect(authLimits.get('login')?.ipLimit).toBe(10);
  });

  // The one that matters: a relaxed limit reaching production is the whole risk
  // this feature introduces, so the guard is asserted rather than assumed.
  // An ALLOWLIST, so every environment that is not explicitly development or
  // test must refuse. The guard used to be `NODE_ENV === 'production'`, which
  // meant unset — the single most likely value, since nothing requires it to be
  // set — permitted unbounded widening of the Argon2id login path. Each case
  // below failed open before.
  it.each([
    ['production', 'production'],
    ['a capitalised variant', 'Production'],
    ['an abbreviation', 'prod'],
    ['a staging environment', 'staging'],
    ['an empty value', ''],
  ])('refuses to relax limits under NODE_ENV=%s', (_label, nodeEnv) => {
    const errors = captureErrors();

    const applied = applyAuthLimitOverridesFromEnv({
      NODE_ENV: nodeEnv,
      [AUTH_LIMIT_OVERRIDES_ENV]: '{"login":{"ipLimit":1000}}',
    });

    expect(applied).toBe(false);
    expect(authLimits.get('login')?.ipLimit).toBe(10);
    expect(errors.mock.calls[0]?.[0]).toContain('only overridable when NODE_ENV');
  });

  // Split out because an ABSENT key is a different code path from an empty
  // string, and it is the default state of a plain `node dist/...` invocation.
  it('refuses to relax limits when NODE_ENV is unset entirely', () => {
    const errors = captureErrors();

    const applied = applyAuthLimitOverridesFromEnv({
      [AUTH_LIMIT_OVERRIDES_ENV]: '{"login":{"ipLimit":1000}}',
    });

    expect(applied).toBe(false);
    expect(authLimits.get('login')?.ipLimit).toBe(10);
    expect(errors.mock.calls[0]?.[0]).toContain('unset');
  });

  // The exported mutator carries the guard too, so it is not a way around the
  // env check for anything that imports this module.
  it('refuses a direct configureAuthLimits call outside development and test', () => {
    const errors = captureErrors();

    expect(configureAuthLimits({ login: { ipLimit: 1000 } }, { NODE_ENV: 'production' })).toBe(
      false
    );
    expect(authLimits.get('login')?.ipLimit).toBe(10);
    expect(errors.mock.calls[0]?.[0]).toContain('Refusing to change auth rate limits');
  });

  it.each([
    ['malformed JSON', 'not json'],
    ['a JSON array', '[{"login":{"ipLimit":1000}}]'],
    ['a JSON scalar', '42'],
  ])('falls back to the shipped limits on %s', (_label, raw) => {
    captureErrors();

    expect(applyAuthLimitOverridesFromEnv({ [AUTH_LIMIT_OVERRIDES_ENV]: raw })).toBe(false);
    expect(authLimits.get('login')?.ipLimit).toBe(10);
  });
});

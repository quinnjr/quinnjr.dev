import type { Request, Response } from 'express';
import {
  getOperationAST,
  Kind,
  OperationTypeNode,
  type ExecutionArgs,
  type FieldNode,
} from 'graphql';
import { createYoga, type Plugin } from 'graphql-yoga';
import { container } from 'tsyringe';

import { RateLimitService, tooManyRequestsError } from '../services/rate-limit.service';

import { createContext } from './context';
import { schema } from './schema';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

interface AuthLimit {
  /** Attempts allowed per client IP per window. */
  ipLimit: number;
  /** Argument naming the subject being attacked (email, mfaToken), if any. */
  subjectArg?: string;
  /** Attempts allowed per subject per window — tighter than the IP bucket,
   *  because a distributed attack rotates IPs but not the target account. */
  subjectLimit: number;
  windowMs: number;
  /**
   * True when the resolver performs an Argon2id verification. Those operations
   * additionally pass through a concurrency gate so they cannot starve SSR.
   */
  cpuBound: boolean;
}

/**
 * Mutations reachable without a session, keyed by root field name. Everything
 * else is guarded by authScopes and costs an attacker a valid session first.
 *
 * This must cover EVERY mutation whose authScopes are `{ public: true }`.
 * `yoga.test.ts` walks the built schema and fails if the two sets diverge, so
 * adding a public mutation without a policy here breaks the build rather than
 * silently shipping an unthrottled endpoint — which is exactly how
 * `beginPasskeyEnrolment` and `completePasskeyEnrolment` were first missed.
 */
const AUTH_LIMIT_DEFAULTS = new Map<string, AuthLimit>([
  [
    'login',
    {
      ipLimit: 10,
      subjectArg: 'email',
      subjectLimit: 5,
      windowMs: FIFTEEN_MINUTES_MS,
      cpuBound: true,
    },
  ],
  [
    'beginPasskeyAuthentication',
    {
      ipLimit: 15,
      subjectArg: 'mfaToken',
      subjectLimit: 10,
      windowMs: FIFTEEN_MINUTES_MS,
      cpuBound: false,
    },
  ],
  [
    'verifyPasskey',
    {
      ipLimit: 15,
      subjectArg: 'mfaToken',
      subjectLimit: 10,
      windowMs: FIFTEEN_MINUTES_MS,
      cpuBound: false,
    },
  ],
  // The enrolment twins. Their limits mirror the assertion pair deliberately:
  // the per-subject bucket is keyed on the mfaToken, and the server's own
  // MFA_MAX_FAILURES budget is spent from the same ticket, so a looser limit
  // here would let an attacker holding a captured ticket exhaust the victim's
  // failure budget and lock them out of a first sign-in they have no other
  // route to complete.
  [
    'beginPasskeyEnrolment',
    {
      ipLimit: 15,
      subjectArg: 'mfaToken',
      subjectLimit: 10,
      windowMs: FIFTEEN_MINUTES_MS,
      cpuBound: false,
    },
  ],
  [
    'completePasskeyEnrolment',
    {
      ipLimit: 15,
      subjectArg: 'mfaToken',
      subjectLimit: 10,
      windowMs: FIFTEEN_MINUTES_MS,
      cpuBound: false,
    },
  ],
  // Not an authentication endpoint, but public and write-bearing: without a cap
  // anyone can inflate a post's view count indefinitely. The subject is the
  // slug, so one bucket per post per address rather than one shared bucket that
  // reading several posts would exhaust legitimately.
  [
    'recordPostView',
    {
      ipLimit: 120,
      subjectArg: 'slug',
      subjectLimit: 30,
      windowMs: FIFTEEN_MINUTES_MS,
      cpuBound: false,
    },
  ],
]);

/**
 * The policy actually enforced, and the map `limitedFields` reads on every
 * request. Seeded from the defaults above and mutated in place by
 * `configureAuthLimits`, so an override takes effect for the next request
 * without rebuilding the plugin or restarting the limiter's windows.
 */
export const AUTH_LIMITS = new Map<string, AuthLimit>(
  [...AUTH_LIMIT_DEFAULTS].map(([name, limit]) => [name, { ...limit }])
);

// Frozen so `resetAuthLimits` always has pristine values to restore to; every
// read below copies out of these rather than handing the originals around.
for (const limit of AUTH_LIMIT_DEFAULTS.values()) {
  Object.freeze(limit);
}

/**
 * The tunable knobs. `subjectArg` and `cpuBound` are deliberately absent:
 * they are structural rather than numeric. Repointing `subjectArg` silently
 * rekeys the per-subject bucket (so the limit stops protecting the thing it
 * names), and clearing `cpuBound` disables the Argon2id concurrency gate —
 * neither is a thing a test should be able to do by accident.
 */
export type AuthLimitOverride = Partial<Pick<AuthLimit, 'ipLimit' | 'subjectLimit' | 'windowMs'>>;

/** Environment variable carrying overrides, as JSON. See `configureAuthLimits`. */
export const AUTH_LIMIT_OVERRIDES_ENV = 'AUTH_RATE_LIMIT_OVERRIDES';

const OVERRIDABLE_KEYS = ['ipLimit', 'subjectLimit', 'windowMs'] as const;

/** Restore the shipped policy. Primarily so a test cannot leak its own limits
 *  into the next one — the map is module state and outlives any single spec. */
export function resetAuthLimits(): void {
  AUTH_LIMITS.clear();
  for (const [name, limit] of AUTH_LIMIT_DEFAULTS) {
    AUTH_LIMITS.set(name, { ...limit });
  }
}

/**
 * A count must be a non-negative integer. Zero is allowed on purpose: it is
 * the only way to test the throttled branch deterministically, since it
 * rejects the very first attempt.
 */
function isValidCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/** Collect every problem with one field's override. Empty means it is usable. */
function overrideProblems(name: string, override: unknown): string[] {
  if (!AUTH_LIMIT_DEFAULTS.has(name)) {
    return [`unknown rate-limited field "${name}"`];
  }
  if (override === null || typeof override !== 'object' || Array.isArray(override)) {
    return [`"${name}" must be an object of limit overrides`];
  }

  const problems: string[] = [];
  for (const [key, value] of Object.entries(override)) {
    if (!(OVERRIDABLE_KEYS as readonly string[]).includes(key)) {
      problems.push(
        `"${name}.${key}" is not overridable (allowed: ${OVERRIDABLE_KEYS.join(', ')})`
      );
    } else if (key === 'windowMs' ? !(isValidCount(value) && value >= 1) : !isValidCount(value)) {
      // A window of 0ms expires before it can count anything, so it is the one
      // value that would silently disable the limit rather than tighten it.
      problems.push(`"${name}.${key}" must be an integer >= ${key === 'windowMs' ? 1 : 0}`);
    }
  }
  return problems;
}

/**
 * Apply per-field overrides on top of the defaults.
 *
 * All-or-nothing: one bad entry rejects the whole payload and leaves the
 * shipped limits in place. A partially-applied override is worse than none,
 * because the half that silently did nothing looks exactly like the half that
 * worked — and the usual reason to reach for this is that a test is already
 * failing in a way nobody understands.
 *
 * Unknown field names are an error rather than a no-op for the same reason: a
 * typo that quietly changes nothing is the trap this is meant to avoid.
 *
 * @returns whether the overrides were applied.
 */
export function configureAuthLimits(overrides: Record<string, unknown>): boolean {
  const entries = Object.entries(overrides);
  const problems = entries.flatMap(([name, override]) => overrideProblems(name, override));

  if (problems.length > 0) {
    console.error(
      `${AUTH_LIMIT_OVERRIDES_ENV}: ignoring overrides, shipped limits stay in force — ${problems.join('; ')}`
    );
    return false;
  }

  for (const [name, override] of entries) {
    const base = AUTH_LIMIT_DEFAULTS.get(name);
    if (base) {
      AUTH_LIMITS.set(name, { ...base, ...(override as AuthLimitOverride) });
    }
  }
  return true;
}

/**
 * Read overrides from the environment. Called once at module load, so a server
 * started with the variable set is throttled by the overridden policy from its
 * first request.
 *
 * Refused outright under NODE_ENV=production. The refusal is loud but not
 * fatal: ignoring the variable leaves the strict shipped limits in force, so
 * failing safe here means staying up, and taking the site down over a
 * already-harmless misconfiguration would be the worse trade.
 *
 * Example — let an end-to-end suite sign in as often as it needs to:
 *
 *   AUTH_RATE_LIMIT_OVERRIDES='{"login":{"ipLimit":1000,"subjectLimit":1000}}'
 *
 * @returns whether any overrides were applied.
 */
export function applyAuthLimitOverridesFromEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  /* eslint-disable-next-line security/detect-object-injection --
   * The key is this module's own string constant, not caller-supplied. */
  const raw = env[AUTH_LIMIT_OVERRIDES_ENV];
  if (raw === undefined || raw.trim() === '') {
    return false;
  }

  if (env['NODE_ENV'] === 'production') {
    console.error(
      `${AUTH_LIMIT_OVERRIDES_ENV} is set but ignored: auth rate limits are not overridable in production. The shipped limits remain in force.`
    );
    return false;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(
      `${AUTH_LIMIT_OVERRIDES_ENV}: not valid JSON, shipped limits stay in force — ${detail}`
    );
    return false;
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error(
      `${AUTH_LIMIT_OVERRIDES_ENV}: expected a JSON object keyed by mutation name, shipped limits stay in force.`
    );
    return false;
  }

  const applied = configureAuthLimits(parsed as Record<string, unknown>);
  if (applied) {
    console.warn(
      `${AUTH_LIMIT_OVERRIDES_ENV} applied: auth rate limits no longer match their shipped values. This must never be set on a public deployment.`
    );
  }
  return applied;
}

applyAuthLimitOverridesFromEnv();

/**
 * The address to charge this request's rate-limit bucket to.
 *
 * `req.ip` is authoritative now that `src/server.ts` sets `trust proxy` to a
 * hop count: Express walks back exactly that many entries from the right of
 * X-Forwarded-For, so the value is one a trusted proxy wrote, not one the
 * client chose. Reading the LEFTMOST entry — as this did before — took the
 * client's own claim, so rotating the header minted a fresh bucket per request
 * and the IP limit was decorative.
 *
 * The header is still consulted, but only as a fallback for callers that reach
 * this without an Express request (Yoga's own `fetch`, used by the tests). The
 * per-subject buckets never depended on the address and are what hold the line
 * against a genuinely distributed attack either way.
 */
function clientAddress(contextValue: unknown): string {
  const ctx = contextValue as { request?: { headers: Headers }; req?: Request } | null;

  if (ctx?.req?.ip) {
    return ctx.req.ip;
  }

  const forwarded = ctx?.request?.headers.get('x-forwarded-for');
  const leftmost = forwarded?.split(',')[0]?.trim();
  if (leftmost) {
    return leftmost;
  }

  return ctx?.req?.socket.remoteAddress ?? 'unknown';
}

/**
 * Resolve a root-field argument to a string, whether it was written inline in
 * the document or passed as a variable.
 */
function argumentValue(
  field: FieldNode,
  name: string,
  variables: Map<string, unknown>
): string | null {
  const node = field.arguments?.find(argument => argument.name.value === name);
  if (!node) {
    return null;
  }
  if (node.value.kind === Kind.STRING) {
    return node.value.value;
  }
  if (node.value.kind === Kind.VARIABLE) {
    const value = variables.get(node.value.name.value);
    return typeof value === 'string' ? value : null;
  }
  return null;
}

/**
 * Spend one attempt from the IP bucket and, when the subject is knowable, from
 * the tighter per-subject bucket. Throws on the first bucket that is exhausted.
 */
function enforce(
  limiter: RateLimitService,
  field: FieldNode,
  config: AuthLimit,
  address: string,
  variables: Map<string, unknown>
): void {
  const name = field.name.value;

  const byIp = limiter.check(
    RateLimitService.key('ip', name, address),
    config.ipLimit,
    config.windowMs
  );
  if (!byIp.allowed) {
    throw tooManyRequestsError(byIp.retryAfterMs);
  }

  const subject = config.subjectArg ? argumentValue(field, config.subjectArg, variables) : null;
  if (subject === null) {
    return;
  }

  // Hashed so the limiter never retains raw emails or mfaTokens.
  const bySubject = limiter.check(
    RateLimitService.key('subject', name, RateLimitService.hashSubject(subject)),
    config.subjectLimit,
    config.windowMs
  );
  if (!bySubject.allowed) {
    // Identical error to the IP case: the caller cannot distinguish "this
    // account is locked" from "your address is locked", and so cannot use
    // throttling to enumerate accounts.
    throw tooManyRequestsError(bySubject.retryAfterMs);
  }
}

/** Root fields of the executed mutation that carry a rate-limit policy. */
function limitedFields(args: ExecutionArgs): Array<[FieldNode, AuthLimit]> {
  const operation = getOperationAST(args.document, args.operationName);
  if (operation?.operation !== OperationTypeNode.MUTATION) {
    return [];
  }

  const matches: Array<[FieldNode, AuthLimit]> = [];
  for (const selection of operation.selectionSet.selections) {
    if (selection.kind !== Kind.FIELD) {
      continue;
    }
    const config = AUTH_LIMITS.get(selection.name.value);
    if (config) {
      matches.push([selection, config]);
    }
  }
  return matches;
}

/**
 * Throttles the unauthenticated authentication surface.
 *
 * Enforced at the plugin layer rather than inside each resolver so that a new
 * auth mutation cannot be added without a conscious decision here, and so the
 * cost is rejected before any database or Argon2 work is scheduled.
 */
export function useAuthRateLimit(): Plugin {
  const limiter = container.resolve(RateLimitService);

  return {
    onExecute({ args, executeFn, setExecuteFn }) {
      const targets = limitedFields(args);
      if (targets.length === 0) {
        return;
      }

      // `variableValues` is `any` on the execution args, so narrow it before
      // Object.entries rather than letting an unchecked `any` through.
      const rawVariables: unknown = args.variableValues;
      const variables = new Map<string, unknown>(
        rawVariables && typeof rawVariables === 'object'
          ? Object.entries(rawVariables as Record<string, unknown>)
          : []
      );
      const address = clientAddress(args.contextValue);

      for (const [field, config] of targets) {
        enforce(limiter, field, config, address, variables);
      }

      if (!targets.some(([, config]) => config.cpuBound)) {
        return;
      }

      // Cap simultaneous Argon2id verifications. Applied around execution
      // rather than inside PasswordService because the gate belongs to the
      // request-admission layer; `runExclusive` releases the slot even when the
      // resolver throws.
      setExecuteFn(executionArgs =>
        limiter.verifyGate.runExclusive(() => Promise.resolve(executeFn(executionArgs)))
      );
    },
  };
}

export function createYogaMiddleware() {
  return createYoga<{ req: Request; res: Response }>({
    schema,
    graphqlEndpoint: '/graphql',
    graphiql: process.env['NODE_ENV'] !== 'production',
    maskedErrors: process.env['NODE_ENV'] === 'production',
    plugins: [useAuthRateLimit()],
    context: ({ request }) => createContext(request.headers.get('authorization')),
  });
}

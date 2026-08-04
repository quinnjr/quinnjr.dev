import { isIP } from 'node:net';

import type { Request, Response } from 'express';
import {
  getOperationAST,
  Kind,
  OperationTypeNode,
  type ExecutionArgs,
  type FieldNode,
  type FragmentDefinitionNode,
  type SelectionSetNode,
} from 'graphql';
import { createYoga, type Plugin } from 'graphql-yoga';
import { container } from 'tsyringe';

import { RateLimitService, tooManyRequestsError } from '../services/rate-limit.service';

import { createContext } from './context';
import { schema } from './schema';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

interface MutationRateLimit {
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
 * One shared shape for every mutation keyed on an mfaToken.
 *
 * Named rather than written out four times, so the "these mirror each other"
 * intent is true by construction. Spelled out per-field, the four were
 * byte-identical and nothing enforced that: retuning the ticket-keyed limit
 * meant editing four literals correctly, and missing one broke the symmetry
 * silently, since the coverage test only checks that a key is PRESENT.
 *
 * They must match because all four spend from the same ticket's
 * MFA_MAX_FAILURES budget: a looser limit on any one of them lets an attacker
 * holding a captured ticket exhaust the victim's failure budget and lock them
 * out of a sign-in they have no other route to complete.
 */
const TICKET_LIMIT: MutationRateLimit = {
  ipLimit: 15,
  subjectArg: 'mfaToken',
  subjectLimit: 10,
  windowMs: FIFTEEN_MINUTES_MS,
  cpuBound: false,
};

const SHIPPED_LIMITS = new Map<string, MutationRateLimit>([
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
  ['beginPasskeyAuthentication', { ...TICKET_LIMIT }],
  ['verifyPasskey', { ...TICKET_LIMIT }],
  // The enrolment twins, deliberately identical to the assertion pair above.
  ['beginPasskeyEnrolment', { ...TICKET_LIMIT }],
  ['completePasskeyEnrolment', { ...TICKET_LIMIT }],
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
 * request. Seeded from the shipped values above and mutated in place by
 * `configureAuthLimits`, so an override takes effect for the next request
 * without rebuilding the plugin or restarting the limiter's windows.
 *
 * NOT exported. It was, and that made the careful validation in
 * `configureAuthLimits` — which refuses `subjectArg`/`cpuBound` changes,
 * non-integers and a zero window — optional rather than the only door: any
 * importer could write `activeLimits.get('login').subjectArg = 'password'` or
 * `activeLimits.clear()` and bypass every check, including the environment
 * guard. Read it through `authLimits` below.
 */
const activeLimits = new Map<string, MutationRateLimit>(
  [...SHIPPED_LIMITS].map(([name, limit]) => [name, { ...limit }])
);

/**
 * Read-only view of the enforced policy, for tests and diagnostics.
 *
 * `get` hands back a frozen copy rather than the live object, so a caller
 * cannot mutate the policy through a value it merely read.
 */
export const authLimits = {
  names(): string[] {
    return [...activeLimits.keys()];
  },
  get(name: string): Readonly<MutationRateLimit> | undefined {
    const limit = activeLimits.get(name);
    return limit ? Object.freeze({ ...limit }) : undefined;
  },
};

// Frozen so `resetAuthLimits` always has pristine values to restore to; every
// read below copies out of these rather than handing the originals around.
for (const limit of SHIPPED_LIMITS.values()) {
  Object.freeze(limit);
}

/**
 * The tunable knobs. `subjectArg` and `cpuBound` are deliberately absent:
 * they are structural rather than numeric. Repointing `subjectArg` silently
 * rekeys the per-subject bucket (so the limit stops protecting the thing it
 * names), and clearing `cpuBound` disables the Argon2id concurrency gate —
 * neither is a thing a test should be able to do by accident.
 */
export type MutationRateLimitOverride = Partial<
  Pick<MutationRateLimit, 'ipLimit' | 'subjectLimit' | 'windowMs'>
>;

/** Environment variable carrying overrides, as JSON. See `configureAuthLimits`. */
export const AUTH_LIMIT_OVERRIDES_ENV = 'AUTH_RATE_LIMIT_OVERRIDES';

const OVERRIDABLE_KEYS = ['ipLimit', 'subjectLimit', 'windowMs'] as const;

/** Restore the shipped policy. Primarily so a test cannot leak its own limits
 *  into the next one — the map is module state and outlives any single spec. */
export function resetAuthLimits(): void {
  activeLimits.clear();
  for (const [name, limit] of SHIPPED_LIMITS) {
    activeLimits.set(name, { ...limit });
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
  if (!SHIPPED_LIMITS.has(name)) {
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
    } else {
      // A window of 0ms expires before it can count anything, so it is the one
      // value that would silently disable the limit rather than tighten it.
      // Every other field may legitimately be 0, which rejects the first
      // attempt and is the only way to reach the throttled branch in a test.
      //
      // The minimum is hoisted rather than computed twice: the condition used
      // to branch on `key === 'windowMs'` inside a negated conjunction and then
      // repeat the same comparison in the message, so changing the bound needed
      // two coordinated edits on adjacent lines.
      const minimum = key === 'windowMs' ? 1 : 0;
      if (!isValidCount(value) || value < minimum) {
        problems.push(`"${name}.${key}" must be an integer >= ${minimum}`);
      }
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
export function configureAuthLimits(
  overrides: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  // The environment guard lives here as well as in
  // `applyAuthLimitOverridesFromEnv`, because this function is exported: with
  // the check only at the env-reading layer, any future caller — or anything
  // that imports this module — could relax the limits in production without
  // passing the gate at all. Checked in both places so the guarded path is the
  // only path.
  const nodeEnv = env['NODE_ENV'];
  if (nodeEnv === undefined || !OVERRIDABLE_ENVIRONMENTS.has(nodeEnv)) {
    console.error(
      `Refusing to change auth rate limits: only permitted when NODE_ENV is one of ${[...OVERRIDABLE_ENVIRONMENTS].join(', ')}.`
    );
    return false;
  }

  const entries = Object.entries(overrides);
  const problems = entries.flatMap(([name, override]) => overrideProblems(name, override));

  if (problems.length > 0) {
    console.error(
      `${AUTH_LIMIT_OVERRIDES_ENV}: ignoring overrides, shipped limits stay in force — ${problems.join('; ')}`
    );
    return false;
  }

  for (const [name, override] of entries) {
    const base = SHIPPED_LIMITS.get(name);
    if (base) {
      activeLimits.set(name, { ...base, ...(override as MutationRateLimitOverride) });
    }
  }
  return true;
}

/**
 * Environments in which auth rate limits may be relaxed.
 *
 * An ALLOWLIST, deliberately. The guard was previously
 * `NODE_ENV === 'production'` — a denylist of exactly one string — so an unset,
 * empty, `Production`, `prod` or `staging` value all permitted unbounded
 * widening of the Argon2id-backed login path. Unset is the dangerous case:
 * nothing in this repo requires NODE_ENV to be set, and the same unset value
 * simultaneously enables GraphiQL and disables `maskedErrors`, so one omission
 * yields an introspectable endpoint with unmasked errors and no login throttle.
 * Failing closed means an unrecognised environment keeps the shipped limits.
 */
const OVERRIDABLE_ENVIRONMENTS = new Set(['development', 'test']);

/**
 * Read overrides from the environment. Called once at module load, so a server
 * started with the variable set is throttled by the overridden policy from its
 * first request.
 *
 * Refused outside development and test. The refusal is loud but not fatal:
 * ignoring the variable leaves the strict shipped limits in force, so failing
 * safe here means staying up, and taking the site down over an
 * already-harmless misconfiguration would be the worse trade.
 *
 * Example — let an end-to-end suite sign in as often as it needs to:
 *
 *   AUTH_RATE_LIMIT_OVERRIDES='{"login":{"ipLimit":1000,"subjectLimit":1000}}'
 *
 * @returns whether any overrides were applied.
 */
export function applyAuthLimitOverridesFromEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env['AUTH_RATE_LIMIT_OVERRIDES'];
  if (raw === undefined || raw.trim() === '') {
    return false;
  }

  const nodeEnv = env['NODE_ENV'];
  if (nodeEnv === undefined || !OVERRIDABLE_ENVIRONMENTS.has(nodeEnv)) {
    console.error(
      `${AUTH_LIMIT_OVERRIDES_ENV} is set but ignored: auth rate limits are only overridable when NODE_ENV is one of ${[...OVERRIDABLE_ENVIRONMENTS].join(', ')} (got ${nodeEnv === undefined ? 'unset' : `"${nodeEnv}"`}). The shipped limits remain in force.`
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
 * Only `req.ip` and the socket address are considered, and `req.ip` must parse
 * as an IP address before it is used. Reading X-Forwarded-For here directly —
 * as an earlier version did, taking the LEFTMOST entry — took the client's own
 * claim, so rotating the header minted a fresh bucket per request and the IP
 * limit was decorative. That branch is gone rather than kept as a fallback:
 * being selected by the shape of the data rather than by build target, it would
 * have silently restored the forgeable behaviour whenever `req` was absent.
 *
 * How much `req.ip` is worth depends entirely on `trust proxy` being right for
 * the deployment — see src/server/trust-proxy.ts. The `net.isIP` check is the
 * cheap backstop: a malformed or spoofed value that survived Express's own
 * parsing cannot become a bucket key.
 *
 * Callers with no Express request (Yoga's own `fetch`, used by the tests) fall
 * through to `'unknown'`, so they share one bucket — which is why tests that
 * need distinct buckets construct a `req`-shaped context.
 */
export function clientAddress(contextValue: unknown): string {
  // Narrowed to the two fields actually read, with every level optional. The
  // parameter is genuinely `unknown` — Yoga hands over whatever server context
  // it was given — so asserting the full Express `Request` here would be a lie
  // that makes `socket` look guaranteed and turns a missing one into a
  // TypeError on the request path.
  const ctx = contextValue as {
    req?: { ip?: string; socket?: { remoteAddress?: string } };
  } | null;

  const ip = ctx?.req?.ip;
  if (ip && isIP(ip) !== 0) {
    return ip;
  }

  const socketAddress = ctx?.req?.socket?.remoteAddress;
  return socketAddress && isIP(socketAddress) !== 0 ? socketAddress : 'unknown';
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
  config: MutationRateLimit,
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

/**
 * Every root field the operation executes, with fragments resolved.
 *
 * Walking only the operation's direct `FIELD` selections was a complete bypass
 * of this plugin: `mutation { ...L } fragment L on Mutation { login(...) }`
 * executes `login` while the selection set contains nothing but a spread, so
 * `limitedFields` returned empty and `onExecute` bailed before enforcing any
 * bucket — and before the Argon2id concurrency gate, making it a CPU-exhaustion
 * vector as well as unmetered password guessing. Every entry in activeLimits was
 * reachable this way.
 *
 * `visited` guards fragment cycles. A cyclic document is invalid GraphQL and is
 * normally rejected before execution, but this must not be the thing that
 * depends on validation having run.
 */
function rootFields(
  selectionSet: SelectionSetNode,
  fragments: ReadonlyMap<string, FragmentDefinitionNode>,
  visited: Set<string>
): FieldNode[] {
  return selectionSet.selections.flatMap(selection => {
    if (selection.kind === Kind.FIELD) {
      return [selection];
    }
    if (selection.kind === Kind.INLINE_FRAGMENT) {
      return rootFields(selection.selectionSet, fragments, visited);
    }
    const name = selection.name.value;
    if (visited.has(name)) {
      return [];
    }
    visited.add(name);
    const fragment = fragments.get(name);
    return fragment ? rootFields(fragment.selectionSet, fragments, visited) : [];
  });
}

/** Root fields of the executed mutation that carry a rate-limit policy. */
function limitedFields(args: ExecutionArgs): Array<[FieldNode, MutationRateLimit]> {
  const operation = getOperationAST(args.document, args.operationName);
  if (operation?.operation !== OperationTypeNode.MUTATION) {
    return [];
  }

  const fragments = new Map<string, FragmentDefinitionNode>(
    args.document.definitions
      .filter(
        (definition): definition is FragmentDefinitionNode =>
          definition.kind === Kind.FRAGMENT_DEFINITION
      )
      .map(definition => [definition.name.value, definition])
  );

  const matches: Array<[FieldNode, MutationRateLimit]> = [];
  for (const field of rootFields(operation.selectionSet, fragments, new Set())) {
    const config = activeLimits.get(field.name.value);
    if (config) {
      matches.push([field, config]);
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
export function usePublicMutationRateLimit(): Plugin {
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
    plugins: [usePublicMutationRateLimit()],
    context: ({ request }) => createContext(request.headers.get('authorization')),
  });
}

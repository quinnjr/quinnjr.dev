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
 */
const AUTH_LIMITS = new Map<string, AuthLimit>([
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
]);

/**
 * Best-effort client address.
 *
 * LIMITATION: `app.set('trust proxy', ...)` is NOT configured in src/server.ts,
 * so Express's own `req.ip` reports the address of the DigitalOcean App
 * Platform edge rather than the caller, which would collapse every visitor into
 * one bucket. We therefore read the leftmost X-Forwarded-For entry — the value
 * App Platform appends the real client to — while accepting that a client can
 * forge that header and mint itself a fresh bucket per request.
 *
 * This is not sound until `app.set('trust proxy', 1)` (or the platform's proxy
 * count) is set, after which `req.ip` becomes authoritative and should be
 * preferred here. The per-subject buckets below do not depend on the IP and
 * remain effective against credential stuffing regardless.
 */
function clientAddress(contextValue: unknown): string {
  const ctx = contextValue as { request?: { headers: Headers }; req?: Request } | null;

  const forwarded = ctx?.request?.headers.get('x-forwarded-for');
  const leftmost = forwarded?.split(',')[0]?.trim();
  if (leftmost) {
    return leftmost;
  }

  return ctx?.req?.socket.remoteAddress ?? ctx?.req?.ip ?? 'unknown';
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

import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { GraphQLError } from 'graphql';

import type { User } from '../../../generated/prisma/client';
import { ExpiredCeremonyError, LastPasskeyError } from '../../services/webauthn.service';
import type { MfaScope, MfaTicketClaims } from '../auth';
import { readMfaTicket, signSession } from '../auth';
import { builder } from '../builder';
import type { GraphQLContext } from '../context';
import { requireUser } from '../context';
import { AuthPayload, PasskeyType } from '../types';

import { webauthnService } from './services';

/**
 * A WebAuthn ceremony failure is a user-facing condition (wrong key, cancelled
 * prompt, expired challenge), not a server fault. Surfacing it as
 * UNAUTHENTICATED keeps production error masking from flattening it to
 * "Unexpected error" and leaving the user with nothing actionable.
 */
/** Identical wording for every stale/invalid mfaToken path: the caller learns
 *  only that the attempt is over, never whether the account or key exists. */
const EXPIRED_ATTEMPT = 'This sign-in attempt has expired. Start again.';

/** The only other thing a caller is ever told. Deliberately says nothing about
 *  which credential was offered or why the library rejected it. */
const COULD_NOT_VERIFY = 'That passkey could not be verified. Try again.';

function expiredAttempt(): GraphQLError {
  return new GraphQLError(EXPIRED_ATTEMPT, { extensions: { code: 'UNAUTHENTICATED' } });
}

/**
 * Read a ticket and require it to be of the expected kind.
 *
 * The two ticket kinds are minted by the same function and verify under the
 * same key, so without this an `assert` ticket — issued to an account that
 * ALREADY has a passkey — could be spent on `completePasskeyEnrolment`
 * instead. A caller who knew only the password could then answer the
 * second-factor demand by registering their own authenticator, which defeats
 * the entire feature. Returns null on any mismatch so the caller answers with
 * the same expired-attempt string as every other rejection.
 */
async function readScopedTicket(
  token: string,
  expected: MfaScope
): Promise<MfaTicketClaims | null> {
  const ticket = await readMfaTicket(token);
  return ticket?.scope === expected ? ticket : null;
}

/**
 * Charge a failed ceremony against the ticket's `MFA_MAX_FAILURES` budget,
 * without letting the bookkeeping displace the error that caused it.
 *
 * Awaiting `recordMfaFailure` bare inside a catch meant a rejection there — a
 * connection blip or pool exhaustion, most likely exactly when things are
 * already going wrong — replaced the ceremony error entirely. `asAuthError`
 * then never ran, so the `[passkey] …` log line was never written and the
 * original failure was lost; the Prisma error escaped unhandled and production
 * masking turned it into a bare "Unexpected error" with no UNAUTHENTICATED
 * code, which is an observably different shape from every other failure on
 * these endpoints and so a small oracle in its own right.
 */
async function chargeFailure(jti: string, context: string): Promise<void> {
  try {
    await webauthnService().recordMfaFailure(jti);
  } catch (error) {
    console.error(`[passkey] recordMfaFailure after ${context}:`, error);
  }
}

/**
 * Load the account an enrolment ticket names, and confirm it still has no
 * credential.
 *
 * Both lookups used to sit outside any `try`, so a Prisma failure threw
 * straight out of the resolver: production masking flattened it to "Unexpected
 * error" and — unlike every other failure on these endpoints — nothing wrote a
 * `[passkey] …` line, because `asAuthError` is the only logger. An operator
 * watching first sign-ins fail site-wide had no server-side trace and could not
 * tell a database outage from callers presenting stale tickets.
 *
 * An outage is deliberately NOT collapsed into `expiredAttempt()`. That string
 * is the anti-oracle for authentication outcomes; reporting infrastructure
 * failure as "your attempt expired" sends the user to retry a thing that cannot
 * work, and hides the incident. It is safe to distinguish because it does not
 * depend on whether the account exists.
 */
async function loadEnrolmentSubject(
  ctx: GraphQLContext,
  ticket: MfaTicketClaims,
  context: string
): Promise<User | null> {
  let user: User | null;
  let alreadyEnrolled: boolean;
  try {
    user = await ctx.prisma.user.findUnique({ where: { id: ticket.userId } });
    alreadyEnrolled = await webauthnService().hasPasskeys(ticket.userId);
  } catch (error) {
    console.error(`[passkey] ${context} lookup:`, error);
    throw new GraphQLError('Service temporarily unavailable. Try again shortly.', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  // The scope check is the ticket saying which path it belongs to; this is the
  // database saying so. A credential could have been enrolled between minting
  // and spending, and this route must never be a way past an existing second
  // factor.
  if (!user || alreadyEnrolled) {
    return null;
  }
  return user;
}

/**
 * Collapse any ceremony failure to one of exactly two strings.
 *
 * Passing service messages through verbatim defeated the production error
 * masking on the one surface that most needs it: "No passkeys are registered
 * for this account" and "That passkey is not registered for this account" are
 * distinguishable answers about an account the caller has not authenticated to,
 * and raw @simplewebauthn messages leak internals on top. The detail is kept —
 * it just goes to the server log instead of the wire.
 */
function asAuthError(error: unknown, context: string): GraphQLError {
  console.error(`[passkey] ${context}:`, error);
  if (error instanceof ExpiredCeremonyError) {
    return expiredAttempt();
  }
  return new GraphQLError(COULD_NOT_VERIFY, { extensions: { code: 'UNAUTHENTICATED' } });
}

builder.mutationFields(t => ({
  /**
   * Step one of enrolment. Returns the creation options verbatim for
   * `navigator.credentials.create()`; the matching challenge is held server-side.
   */
  beginPasskeyRegistration: t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = requireUser(ctx);
      try {
        return await webauthnService().beginRegistration(user);
      } catch (error) {
        throw asAuthError(error, 'beginRegistration');
      }
    },
  }),

  /**
   * Enrolment during a first sign-in, before any session exists.
   *
   * Public scope by necessity: the account has no passkey, so `login` issued a
   * ticket instead of a session and this is the only thing identifying the
   * caller. It is the enrolment twin of `beginPasskeyAuthentication`.
   */
  beginPasskeyEnrolment: t.field({
    type: 'JSON',
    authScopes: { public: true },
    args: { mfaToken: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const ticket = await readScopedTicket(args.mfaToken, 'enrol');
      if (!ticket) {
        throw expiredAttempt();
      }

      const user = await loadEnrolmentSubject(ctx, ticket, 'beginPasskeyEnrolment');
      if (!user) {
        throw expiredAttempt();
      }

      try {
        await webauthnService().validateMfaTicket(ticket);
        return await webauthnService().beginRegistration(user);
      } catch (error) {
        throw asAuthError(error, 'beginPasskeyEnrolment');
      }
    },
  }),

  /**
   * Completes a first-sign-in enrolment and mints the session.
   *
   * The ticket is spent only once the credential is stored, so a failed
   * ceremony leaves the user able to retry rather than locked out mid-flow
   * with no session and no passkey.
   */
  completePasskeyEnrolment: t.field({
    type: AuthPayload,
    authScopes: { public: true },
    args: {
      mfaToken: t.arg.string({ required: true }),
      response: t.arg({ type: 'JSON', required: true }),
      name: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ticket = await readScopedTicket(args.mfaToken, 'enrol');
      if (!ticket) {
        throw expiredAttempt();
      }

      // See loadEnrolmentSubject: enrolment is only ever a first-credential
      // path. Allowing it against an account that already has one would let a
      // password alone mint a session by registering a new authenticator.
      const user = await loadEnrolmentSubject(ctx, ticket, 'completePasskeyEnrolment');
      if (!user) {
        throw expiredAttempt();
      }

      try {
        await webauthnService().validateMfaTicket(ticket);
      } catch (error) {
        throw asAuthError(error, 'validateMfaTicket');
      }

      try {
        await webauthnService().finishRegistration(
          user,
          args.response as RegistrationResponseJSON,
          args.name
        );
      } catch (error) {
        await chargeFailure(ticket.jti, 'completePasskeyEnrolment');
        throw asAuthError(error, 'completePasskeyEnrolment');
      }

      try {
        await webauthnService().consumeMfaTicket(ticket.jti);
      } catch (error) {
        throw asAuthError(error, 'consumeMfaTicket');
      }

      return {
        token: await signSession(user),
        user,
        mfaRequired: false,
        enrolmentRequired: false,
        mfaToken: null,
      };
    },
  }),

  finishPasskeyRegistration: t.field({
    type: PasskeyType,
    authScopes: { authenticated: true },
    args: {
      response: t.arg({ type: 'JSON', required: true }),
      name: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireUser(ctx);
      try {
        return await webauthnService().finishRegistration(
          user,
          args.response as RegistrationResponseJSON,
          args.name
        );
      } catch (error) {
        throw asAuthError(error, 'finishRegistration');
      }
    },
  }),

  /**
   * Step two of sign-in, first half. Public scope by necessity — the caller
   * holds no session yet — so the mfaToken is the only thing establishing who
   * is asking, and an invalid one reveals nothing about whether the account
   * exists or what it has enrolled.
   *
   * Every failure here answers with the same string, including the one raised
   * when the account has no credentials: a garbage token and a valid token for
   * a passkey-less account must be indistinguishable, or this becomes an
   * enrolment oracle.
   *
   * NOTE: validating the ticket first does NOT stop a replayed token from
   * restarting the victim's in-flight ceremony. `validateMfaTicket` records and
   * checks the ticket but marks nothing, so the same token passes as often as
   * it is presented, and each pass reaches `beginAuthentication` →
   * `storeChallenge`, which discards the pending challenge. What actually
   * bounds that abuse is the per-subject rate-limit bucket in `yoga.ts`, keyed
   * on the mfaToken itself. An earlier version of this comment claimed the
   * validation call was the defence; it never was.
   */
  beginPasskeyAuthentication: t.field({
    type: 'JSON',
    authScopes: { public: true },
    args: { mfaToken: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      const ticket = await readScopedTicket(args.mfaToken, 'assert');
      if (!ticket) {
        throw expiredAttempt();
      }
      try {
        await webauthnService().validateMfaTicket(ticket);
        return await webauthnService().beginAuthentication(ticket.userId);
      } catch (error) {
        console.error('[passkey] beginAuthentication:', error);
        throw expiredAttempt();
      }
    },
  }),

  /**
   * Step two of sign-in, second half. The mfaToken is what proves the password
   * step passed; it is not a session and grants nothing on its own.
   *
   * The ticket is claimed before the assertion and spent after it, so one token
   * buys one session and a bounded number of wrong answers rather than five
   * minutes of unlimited guesses.
   */
  verifyPasskey: t.field({
    type: AuthPayload,
    authScopes: { public: true },
    args: {
      mfaToken: t.arg.string({ required: true }),
      response: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ticket = await readScopedTicket(args.mfaToken, 'assert');
      if (!ticket) {
        throw expiredAttempt();
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: ticket.userId } });
      if (!user) {
        throw expiredAttempt();
      }

      try {
        await webauthnService().validateMfaTicket(ticket);
      } catch (error) {
        throw asAuthError(error, 'validateMfaTicket');
      }

      try {
        await webauthnService().finishAuthentication(
          ticket.userId,
          args.response as AuthenticationResponseJSON
        );
      } catch (error) {
        await chargeFailure(ticket.jti, 'finishAuthentication');
        throw asAuthError(error, 'finishAuthentication');
      }

      // Spend the ticket only once the assertion held, and before the session
      // is minted: if a concurrent request already spent it, this one leaves
      // with nothing rather than a second session off one password check.
      try {
        await webauthnService().consumeMfaTicket(ticket.jti);
      } catch (error) {
        throw asAuthError(error, 'consumeMfaTicket');
      }

      return {
        token: await signSession(user),
        user,
        mfaRequired: false,
        enrolmentRequired: false,
        mfaToken: null,
      };
    },
  }),

  /**
   * `confirmRemoveLastPasskey` is required to remove the account's last
   * credential. It does not revert the account to password-only — nothing
   * does — but it does leave the next sign-in unable to complete without a
   * fresh enrolment, which locks the owner out on any device that cannot do
   * WebAuthn.
   *
   * The gate also blunts a takeover: without it, anyone holding a stolen
   * session token could enrol their own authenticator and drop the victim's in
   * two silent calls. A fresh re-authentication would be the stronger gate;
   * this one at least makes the consequence explicit.
   */
  deletePasskey: t.boolean({
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
      confirmRemoveLastPasskey: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireUser(ctx);
      let removed: boolean;
      try {
        removed = await webauthnService().deleteForUser(
          user.id,
          args.id,
          args.confirmRemoveLastPasskey ?? false
        );
      } catch (error) {
        if (error instanceof LastPasskeyError) {
          throw new GraphQLError(
            'This is the only passkey on the account. Removing it means the next sign-in must enrol a new one before it can complete.',
            { extensions: { code: 'CONFIRM_REMOVE_LAST_PASSKEY' } }
          );
        }
        throw error;
      }
      if (!removed) {
        throw new GraphQLError('Passkey not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return true;
    },
  }),
}));

builder.queryFields(t => ({
  /** The caller's own passkeys. Never another user's — there is no argument to
   *  ask for someone else's. */
  passkeys: t.field({
    type: [PasskeyType],
    authScopes: { authenticated: true },
    resolve: (_root, _args, ctx) => webauthnService().listForUser(requireUser(ctx).id),
  }),
}));

import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { GraphQLError } from 'graphql';

import { ExpiredCeremonyError, LastPasskeyError } from '../../services/webauthn.service';
import { readMfaTicket, signSession } from '../auth';
import { builder } from '../builder';
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
   * enrolment oracle. Claiming the ticket first also stops a third party who
   * replayed a captured token from restarting — and so destroying — the
   * victim's in-flight ceremony.
   */
  beginPasskeyAuthentication: t.field({
    type: 'JSON',
    authScopes: { public: true },
    args: { mfaToken: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      const ticket = await readMfaTicket(args.mfaToken);
      if (!ticket) {
        throw expiredAttempt();
      }
      try {
        await webauthnService().claimMfaTicket(ticket);
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
      const ticket = await readMfaTicket(args.mfaToken);
      if (!ticket) {
        throw expiredAttempt();
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: ticket.userId } });
      if (!user) {
        throw expiredAttempt();
      }

      try {
        await webauthnService().claimMfaTicket(ticket);
      } catch (error) {
        throw asAuthError(error, 'claimMfaTicket');
      }

      try {
        await webauthnService().finishAuthentication(
          ticket.userId,
          args.response as AuthenticationResponseJSON
        );
      } catch (error) {
        await webauthnService().recordMfaFailure(ticket.jti);
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

      return { token: await signSession(user), user, mfaRequired: false, mfaToken: null };
    },
  }),

  /**
   * `confirmDisableMfa` is required to remove the account's last credential,
   * because doing so reverts it to password-only. Without the gate, anyone
   * holding a stolen session token could enrol their own authenticator and drop
   * the victim's, or simply turn the second factor off, in one silent call.
   * A fresh re-authentication would be the stronger gate; this one at least
   * makes the downgrade explicit.
   */
  deletePasskey: t.boolean({
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
      confirmDisableMfa: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireUser(ctx);
      let removed: boolean;
      try {
        removed = await webauthnService().deleteForUser(
          user.id,
          args.id,
          args.confirmDisableMfa ?? false
        );
      } catch (error) {
        if (error instanceof LastPasskeyError) {
          throw new GraphQLError(
            'This is the only passkey on the account. Removing it turns off two-factor sign-in.',
            { extensions: { code: 'CONFIRM_DISABLE_MFA' } }
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

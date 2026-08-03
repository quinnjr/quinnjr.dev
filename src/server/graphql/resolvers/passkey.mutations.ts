import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { GraphQLError } from 'graphql';

import { signSession, verifyMfaToken } from '../auth';
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

function expiredAttempt(): GraphQLError {
  return new GraphQLError(EXPIRED_ATTEMPT, { extensions: { code: 'UNAUTHENTICATED' } });
}

function asAuthError(error: unknown): GraphQLError {
  const message =
    error instanceof Error ? error.message : 'Passkey verification could not be completed';
  return new GraphQLError(message, { extensions: { code: 'UNAUTHENTICATED' } });
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
        throw asAuthError(error);
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
        throw asAuthError(error);
      }
    },
  }),

  /**
   * Step two of sign-in, first half. Public scope by necessity — the caller
   * holds no session yet — so the mfaToken is the only thing establishing who
   * is asking, and an invalid one reveals nothing about whether the account
   * exists or what it has enrolled.
   */
  beginPasskeyAuthentication: t.field({
    type: 'JSON',
    authScopes: { public: true },
    args: { mfaToken: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      const userId = await verifyMfaToken(args.mfaToken);
      if (!userId) {
        throw expiredAttempt();
      }
      try {
        return await webauthnService().beginAuthentication(userId);
      } catch (error) {
        throw asAuthError(error);
      }
    },
  }),

  /**
   * Step two of sign-in, second half. The mfaToken is what proves the password
   * step passed; it is not a session and grants nothing on its own.
   */
  verifyPasskey: t.field({
    type: AuthPayload,
    authScopes: { public: true },
    args: {
      mfaToken: t.arg.string({ required: true }),
      response: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await verifyMfaToken(args.mfaToken);
      if (!userId) {
        throw expiredAttempt();
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw expiredAttempt();
      }

      try {
        await webauthnService().finishAuthentication(
          userId,
          args.response as AuthenticationResponseJSON
        );
      } catch (error) {
        throw asAuthError(error);
      }

      return { token: await signSession(user), user, mfaRequired: false, mfaToken: null };
    },
  }),

  deletePasskey: t.boolean({
    authScopes: { authenticated: true },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const user = requireUser(ctx);
      const removed = await webauthnService().deleteForUser(user.id, args.id);
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

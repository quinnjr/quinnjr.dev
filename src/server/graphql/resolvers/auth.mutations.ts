// src/server/graphql/resolvers/auth.mutations.ts
import { GraphQLError } from 'graphql';

import { signMfaToken, signSession } from '../auth';
import { builder } from '../builder';
import { AuthPayload } from '../types';

import { passwordService, webauthnService } from './services';

/**
 * Argon2id hash of a throwaway string, verified when no user matches the email.
 *
 * The error message is already identical for "unknown email" and "wrong
 * password", but the work was not: skipping the verify returned in under a
 * millisecond while a real account paid the full KDF cost, and that gap is
 * enough to enumerate registered addresses. Hard-coded rather than hashed at
 * startup so it costs nothing to load.
 */
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$+NCddCvybUdNuALabIoN6Q$oYuf/HXq9Bv2von05B8xe+lGKzmvDKxxtrdrNp0rQ4c';

builder.mutationFields(t => ({
  login: t.field({
    type: AuthPayload,
    authScopes: { public: true },
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: args.email } });
      const ok = await passwordService().verify(
        user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        args.password
      );
      if (!user || !ok) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      // Passkeys are a second factor, not an alternative: once one is
      // enrolled, the password alone stops being sufficient. No session token
      // is issued here — only proof that the first factor passed.
      if (await webauthnService().hasPasskeys(user.id)) {
        return {
          token: null,
          user: null,
          mfaRequired: true,
          mfaToken: await signMfaToken(user),
        };
      }

      return { token: await signSession(user), user, mfaRequired: false, mfaToken: null };
    },
  }),
}));

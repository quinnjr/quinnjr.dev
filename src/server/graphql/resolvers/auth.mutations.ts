// src/server/graphql/resolvers/auth.mutations.ts
import { GraphQLError } from 'graphql';

// Note the absence of `signSession`: this resolver can no longer mint a
// session at all. Every path out of it is a ticket, which is what makes the
// second factor structural rather than a policy the code could forget.
import { signMfaToken } from '../auth';
import { builder } from '../builder';
import { AuthPayload } from '../types';

import { passwordService } from './services';

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
      // The passkey count rides along on the user lookup. Fetching it
      // separately cost a second round trip on the hot path of every sign-in,
      // for a single boolean that the same row join already carries.
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email },
        include: { _count: { select: { passkeys: true } } },
      });
      const ok = await passwordService().verify(
        user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        args.password
      );
      if (!user || !ok) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      // A second factor is mandatory, so the password alone never yields a
      // session — it only ever produces a ticket. Which ticket depends on
      // whether there is a credential to assert against yet.
      //
      // Enforcing this server-side is the whole point: the client could
      // otherwise skip an enrolment prompt and keep using the token, which is
      // what makes a UI-only requirement cosmetic.
      if (user._count.passkeys > 0) {
        return {
          token: null,
          user: null,
          mfaRequired: true,
          enrolmentRequired: false,
          mfaToken: await signMfaToken(user, 'assert'),
        };
      }

      return {
        token: null,
        user: null,
        mfaRequired: false,
        enrolmentRequired: true,
        mfaToken: await signMfaToken(user, 'enrol'),
      };
    },
  }),
}));

// src/server/graphql/resolvers/auth.mutations.ts
import { GraphQLError } from 'graphql';

import type { User } from '../../../generated/prisma/client';
import { signSession } from '../auth';
import { builder } from '../builder';
import { UserType } from '../types';

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

interface AuthPayloadShape {
  token: string;
  user: User;
}

const AuthPayload = builder.objectRef<AuthPayloadShape>('AuthPayload').implement({
  fields: t => ({
    token: t.exposeString('token'),
    user: t.field({ type: UserType, resolve: p => p.user }),
  }),
});

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
      return { token: await signSession(user), user };
    },
  }),
}));

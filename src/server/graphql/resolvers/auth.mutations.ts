// src/server/graphql/resolvers/auth.mutations.ts
import { GraphQLError } from 'graphql';

import type { User } from '../../../generated/prisma/client';
import { signSession } from '../auth';
import { builder } from '../builder';
import { UserType } from '../types';

import { passwordService } from './services';

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
      const ok = user ? await passwordService().verify(user.passwordHash, args.password) : false;
      if (!user || !ok) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return { token: await signSession(user), user };
    },
  }),
}));

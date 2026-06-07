// src/server/graphql/builder.ts
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';

import type PrismaTypes from '../../generated/pothos-types';
import { getDatamodel } from '../../generated/pothos-types';
import type { UserRole } from '../../generated/prisma/client';

import { type GraphQLContext, meetsMinimumRole } from './context';
import { DateTimeResolver, JSONResolver } from './scalars';

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  PrismaTypes: PrismaTypes;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
  };
  AuthScopes: {
    public: boolean;
    authenticated: boolean;
    role: UserRole;
  };
}>({
  plugins: [ScopeAuthPlugin, PrismaPlugin],
  scopeAuth: {
    authScopes: ctx => ({
      public: true,
      authenticated: ctx.isAuthenticated,
      role: (minimum: UserRole) => meetsMinimumRole(ctx.user, minimum),
    }),
  },
  prisma: {
    client: ctx => ctx.prisma,
    dmmf: getDatamodel(),
  },
});

builder.addScalarType('DateTime', DateTimeResolver);
builder.addScalarType('JSON', JSONResolver);

// src/server/graphql/context.ts
import { GraphQLError } from 'graphql';
import { container } from 'tsyringe';

import type { PrismaClient, User, UserRole } from '../../generated/prisma/client';
import { DatabaseService } from '../services/database.service';

import { verifySession } from './auth';

export interface GraphQLContext {
  prisma: PrismaClient;
  user: User | null;
  isAuthenticated: boolean;
}

/** Minimum role hierarchy: ADMIN > EDITOR > AUTHOR > VIEWER. A Map keeps lookups
 * off plain-object index access (which the object-injection lint rule flags). */
const ROLE_RANK = new Map<UserRole, number>([
  ['ADMIN', 3],
  ['EDITOR', 2],
  ['AUTHOR', 1],
  ['VIEWER', 0],
]);

/** True when `user` exists and its role meets the given minimum in the hierarchy. */
export function meetsMinimumRole(user: User | null, minimum: UserRole): boolean {
  if (user == null) {
    return false;
  }
  return (ROLE_RANK.get(user.role) ?? 0) >= (ROLE_RANK.get(minimum) ?? 0);
}

/** Return the authenticated user, or throw an UNAUTHENTICATED error. Lets
 * resolvers guarded by authScopes use `ctx.user` without a non-null assertion. */
export function requireUser(ctx: GraphQLContext): User {
  if (!ctx.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user;
}

/**
 * Build the per-request GraphQL context. Verifies the session JWT and loads the
 * matching User; anonymous on missing/invalid token or unknown user.
 */
export async function createContext(authorization: string | null): Promise<GraphQLContext> {
  const db = container.resolve(DatabaseService);
  const prisma = db.getClient();

  const session = await verifySession(authorization);
  if (!session?.sub) {
    return { prisma, user: null, isAuthenticated: false };
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) {
    return { prisma, user: null, isAuthenticated: false };
  }
  return { prisma, user, isAuthenticated: true };
}

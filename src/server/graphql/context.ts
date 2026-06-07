// src/server/graphql/context.ts
import { container } from 'tsyringe';

import type { PrismaClient, User, UserRole } from '../../generated/prisma/client';
import { DatabaseService } from '../services/database.service';

import { verifySession } from './auth';

export interface GraphQLContext {
  prisma: PrismaClient;
  user: User | null;
  isAuthenticated: boolean;
}

/** Minimum role hierarchy: ADMIN > EDITOR > AUTHOR > VIEWER */
export const ROLE_RANK: Record<UserRole, number> = {
  ADMIN: 3,
  EDITOR: 2,
  AUTHOR: 1,
  VIEWER: 0,
};

/** True when `user` exists and its role meets the given minimum in the hierarchy. */
export function meetsMinimumRole(user: User | null, minimum: UserRole): boolean {
  return user != null && ROLE_RANK[user.role] >= ROLE_RANK[minimum];
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

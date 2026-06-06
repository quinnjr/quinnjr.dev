// src/server/graphql/context.ts
import { container } from 'tsyringe';
import { DatabaseService } from '../services/database.service';
import type { PrismaClient } from '../../generated/prisma/client';
import type { User, UserRole } from '../../generated/prisma/client';

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

/** Anonymous context (token-aware factory added in a later task). */
export function createAnonymousContext(): GraphQLContext {
  const db = container.resolve(DatabaseService);
  return { prisma: db.getClient(), user: null, isAuthenticated: false };
}

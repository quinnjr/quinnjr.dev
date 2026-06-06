// src/server/graphql/context.ts
import { container } from 'tsyringe';
import { DatabaseService } from '../services/database.service';
import type { PrismaClient } from '../../generated/prisma/client';
import type { User } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/client';
import { verifyAccessToken } from './auth';

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

/**
 * Build the per-request GraphQL context. Verifies the Auth0 token,
 * upserts the matching User (auto-provision on first login, role VIEWER),
 * and attaches it. Falls back to anonymous context on no/invalid token.
 */
export async function createContext(authorization: string | null): Promise<GraphQLContext> {
  const db = container.resolve(DatabaseService);
  const prisma = db.getClient();

  const payload = await verifyAccessToken(authorization);
  if (!payload?.sub) {
    return { prisma, user: null, isAuthenticated: false };
  }

  const email = (payload['email'] as string | undefined) ?? `${payload.sub}@placeholder.local`;
  const name =
    (payload['name'] as string | undefined) ??
    (payload['nickname'] as string | undefined) ??
    email;
  const picture = payload['picture'] as string | undefined;

  const user = await prisma.user.upsert({
    where: { auth0Id: payload.sub },
    update: { email, name, ...(picture ? { picture } : {}) },
    create: { auth0Id: payload.sub, email, name, picture, role: UserRole.VIEWER },
  });

  return { prisma, user, isAuthenticated: true };
}

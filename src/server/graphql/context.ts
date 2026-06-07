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

/** True when `user` exists and its role meets the given minimum in the hierarchy. */
export function meetsMinimumRole(user: User | null, minimum: UserRole): boolean {
  return user != null && ROLE_RANK[user.role] >= ROLE_RANK[minimum];
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

  // Read first so pure reads don't pay a write; only write on first login or when
  // the cached profile fields have actually changed.
  const existing = await prisma.user.findUnique({ where: { auth0Id: payload.sub } });
  let user = existing;
  if (!existing) {
    user = await prisma.user.create({
      data: { auth0Id: payload.sub, email, name, picture, role: UserRole.VIEWER },
    });
  } else if (
    existing.email !== email ||
    existing.name !== name ||
    (picture !== undefined && existing.picture !== picture)
  ) {
    user = await prisma.user.update({
      where: { auth0Id: payload.sub },
      data: { email, name, ...(picture ? { picture } : {}) },
    });
  }

  return { prisma, user, isAuthenticated: true };
}

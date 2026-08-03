import { container } from 'tsyringe';
import { describe, it, expect, vi, afterEach } from 'vitest';

import * as auth from '../../../src/server/graphql/auth';
import { DatabaseService } from '../../../src/server/services/database.service';

afterEach(() => {
  container.reset();
  vi.restoreAllMocks();
});

describe('createContext', () => {
  it('returns anonymous context when no token', async () => {
    container.registerInstance(DatabaseService, {
      getClient: () => ({}),
    } as never);
    const { createContext } = await import('../../../src/server/graphql/context');
    const ctx = await createContext(null);
    expect(ctx.user).toBeNull();
    expect(ctx.isAuthenticated).toBe(false);
  });

  it('loads the user for a valid token', async () => {
    vi.spyOn(auth, 'verifySession').mockResolvedValue({ sub: 'u1', role: 'ADMIN' });
    const fakeUser = { id: 'u1', email: 'a@b.com', name: 'A', role: 'ADMIN' };
    const findUnique = vi.fn().mockResolvedValue(fakeUser);
    container.registerInstance(DatabaseService, {
      getClient: () => ({ user: { findUnique } }),
    } as never);

    const { createContext } = await import('../../../src/server/graphql/context');
    const ctx = await createContext('Bearer x.y.z');
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user).toEqual(fakeUser);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('is anonymous when the token sub matches no user', async () => {
    vi.spyOn(auth, 'verifySession').mockResolvedValue({ sub: 'ghost', role: 'ADMIN' });
    const findUnique = vi.fn().mockResolvedValue(null);
    container.registerInstance(DatabaseService, {
      getClient: () => ({ user: { findUnique } }),
    } as never);

    const { createContext } = await import('../../../src/server/graphql/context');
    const ctx = await createContext('Bearer x.y.z');
    expect(ctx.user).toBeNull();
    expect(ctx.isAuthenticated).toBe(false);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { container } from 'tsyringe';
import { DatabaseService } from '../../../src/server/services/database.service';
import * as auth from '../../../src/server/graphql/auth';

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

  it('upserts and attaches user for a valid token', async () => {
    vi.spyOn(auth, 'verifyAccessToken').mockResolvedValue({
      sub: 'auth0|abc',
      email: 'a@b.com',
      name: 'A',
    } as never);
    const fakeUser = { id: 'u1', auth0Id: 'auth0|abc', role: 'ADMIN' };
    const upsert = vi.fn().mockResolvedValue(fakeUser);
    container.registerInstance(DatabaseService, {
      getClient: () => ({ user: { upsert } }),
    } as never);

    const { createContext } = await import('../../../src/server/graphql/context');
    const ctx = await createContext('Bearer x.y.z');
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user).toEqual(fakeUser);
    expect(upsert).toHaveBeenCalledOnce();
  });
});

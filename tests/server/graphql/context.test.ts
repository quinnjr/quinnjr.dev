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

  it('creates and attaches a user on first login (no existing row)', async () => {
    vi.spyOn(auth, 'verifyAccessToken').mockResolvedValue({
      sub: 'auth0|abc',
      email: 'a@b.com',
      name: 'A',
    } as never);
    const fakeUser = { id: 'u1', auth0Id: 'auth0|abc', email: 'a@b.com', name: 'A', role: 'ADMIN' };
    const findUnique = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue(fakeUser);
    const update = vi.fn();
    container.registerInstance(DatabaseService, {
      getClient: () => ({ user: { findUnique, create, update } }),
    } as never);

    const { createContext } = await import('../../../src/server/graphql/context');
    const ctx = await createContext('Bearer x.y.z');
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user).toEqual(fakeUser);
    expect(create).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });

  it('does NOT write when the existing user profile is unchanged', async () => {
    vi.spyOn(auth, 'verifyAccessToken').mockResolvedValue({
      sub: 'auth0|abc',
      email: 'a@b.com',
      name: 'A',
    } as never);
    const existing = {
      id: 'u1',
      auth0Id: 'auth0|abc',
      email: 'a@b.com',
      name: 'A',
      picture: null,
      role: 'EDITOR',
    };
    const findUnique = vi.fn().mockResolvedValue(existing);
    const create = vi.fn();
    const update = vi.fn();
    container.registerInstance(DatabaseService, {
      getClient: () => ({ user: { findUnique, create, update } }),
    } as never);

    const { createContext } = await import('../../../src/server/graphql/context');
    const ctx = await createContext('Bearer x.y.z');
    expect(ctx.user).toEqual(existing);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('updates when an existing user profile changed', async () => {
    vi.spyOn(auth, 'verifyAccessToken').mockResolvedValue({
      sub: 'auth0|abc',
      email: 'new@b.com',
      name: 'A',
    } as never);
    const existing = {
      id: 'u1',
      auth0Id: 'auth0|abc',
      email: 'old@b.com',
      name: 'A',
      picture: null,
      role: 'EDITOR',
    };
    const updated = { ...existing, email: 'new@b.com' };
    const findUnique = vi.fn().mockResolvedValue(existing);
    const create = vi.fn();
    const update = vi.fn().mockResolvedValue(updated);
    container.registerInstance(DatabaseService, {
      getClient: () => ({ user: { findUnique, create, update } }),
    } as never);

    const { createContext } = await import('../../../src/server/graphql/context');
    const ctx = await createContext('Bearer x.y.z');
    expect(ctx.user).toEqual(updated);
    expect(update).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
  });
});

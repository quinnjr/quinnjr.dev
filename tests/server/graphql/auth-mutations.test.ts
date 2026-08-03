import { graphql } from 'graphql';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { DatabaseService } from '../../../src/server/services/database.service';
import { PasswordService } from '../../../src/server/services/password.service';

afterEach(() => container.reset());

// `findUnique` returns a user row (with passwordHash) or null.
function ctx(userRow: { id: string; role: string } | null) {
  return {
    prisma: {
      user: {
        findUnique: async () =>
          userRow
            ? { id: userRow.id, email: 'a@b.com', name: 'A', role: userRow.role, passwordHash: 'h' }
            : null,
      },
    },
    user: null,
    isAuthenticated: false,
  } as never;
}

describe('login mutation', () => {
  it('returns a token + user for correct credentials', async () => {
    container.registerInstance(PasswordService, {
      verify: vi.fn().mockResolvedValue(true),
    } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { login(email:"a@b.com", password:"pw") { token user { id } } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN' }),
    });
    expect(result.errors).toBeUndefined();
    const data = result.data?.['login'] as { token: string; user: { id: string } };
    expect(typeof data.token).toBe('string');
    expect(data.user.id).toBe('u1');
  });

  it('rejects wrong credentials with a generic UNAUTHENTICATED error', async () => {
    container.registerInstance(PasswordService, {
      verify: vi.fn().mockResolvedValue(false),
    } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { login(email:"a@b.com", password:"bad") { token } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN' }),
    });
    expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
    expect(result.errors?.[0]?.message).toBe('Invalid email or password');
  });

  it('rejects unknown email with the same generic error', async () => {
    container.registerInstance(PasswordService, { verify: vi.fn() } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { login(email:"nope@b.com", password:"x") { token } }',
      contextValue: ctx(null),
    });
    expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
  });
});

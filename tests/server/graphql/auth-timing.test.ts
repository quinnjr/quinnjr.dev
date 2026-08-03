import { graphql } from 'graphql';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { DatabaseService } from '../../../src/server/services/database.service';
import { PasswordService } from '../../../src/server/services/password.service';

afterEach(() => container.reset());

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

describe('login account enumeration', () => {
  it('runs a password verify even when the email is unknown', async () => {
    const verify = vi.fn().mockResolvedValue(false);
    container.registerInstance(PasswordService, { verify } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');

    const result = await graphql({
      schema,
      source: 'mutation { login(email:"nobody@b.com", password:"x") { token } }',
      contextValue: ctx(null),
    });

    expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
    // Short-circuiting here would make an unknown email measurably faster than
    // a known one, which is enough to enumerate registered addresses.
    expect(verify).toHaveBeenCalledTimes(1);
    const [hash] = verify.mock.calls[0] as [string, string];
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('verifies against the real hash when the user exists', async () => {
    const verify = vi.fn().mockResolvedValue(false);
    container.registerInstance(PasswordService, { verify } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');

    await graphql({
      schema,
      source: 'mutation { login(email:"a@b.com", password:"x") { token } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN' }),
    });

    expect(verify).toHaveBeenCalledWith('h', 'x');
  });
});

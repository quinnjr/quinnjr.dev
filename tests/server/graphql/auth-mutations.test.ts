import { graphql } from 'graphql';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { verifyMfaToken, verifySession } from '../../../src/server/graphql/auth';
import { DatabaseService } from '../../../src/server/services/database.service';
import { PasswordService } from '../../../src/server/services/password.service';
import { WebauthnService } from '../../../src/server/services/webauthn.service';

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

/** Registers the collaborators `login` resolves lazily. `hasPasskeys` is what
 *  decides whether the second factor is demanded. */
function register(opts: { verify?: boolean; hasPasskeys?: boolean } = {}) {
  container.registerInstance(PasswordService, {
    verify: vi.fn().mockResolvedValue(opts.verify ?? true),
  } as never);
  container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
  container.registerInstance(WebauthnService, {
    hasPasskeys: vi.fn().mockResolvedValue(opts.hasPasskeys ?? false),
  } as never);
}

describe('login mutation', () => {
  it('returns a token + user when the account has no passkey enrolled', async () => {
    register({ hasPasskeys: false });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source:
        'mutation { login(email:"a@b.com", password:"pw") { token mfaRequired user { id } } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN' }),
    });
    expect(result.errors).toBeUndefined();
    const data = result.data?.['login'] as {
      token: string;
      mfaRequired: boolean;
      user: { id: string };
    };
    expect(typeof data.token).toBe('string');
    expect(data.mfaRequired).toBe(false);
    expect(data.user.id).toBe('u1');
  });

  it('withholds the session and demands a passkey once one is enrolled', async () => {
    register({ hasPasskeys: true });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source:
        'mutation { login(email:"a@b.com", password:"pw") { token user { id } mfaRequired mfaToken } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN' }),
    });
    expect(result.errors).toBeUndefined();
    const data = result.data?.['login'] as {
      token: string | null;
      user: unknown;
      mfaRequired: boolean;
      mfaToken: string;
    };
    // A correct password alone must not yield a session.
    expect(data.token).toBeNull();
    expect(data.user).toBeNull();
    expect(data.mfaRequired).toBe(true);
    expect(typeof data.mfaToken).toBe('string');
  });

  it('issues an mfaToken that identifies the user but is not a session', async () => {
    register({ hasPasskeys: true });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { login(email:"a@b.com", password:"pw") { mfaToken } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN' }),
    });
    const { mfaToken } = result.data?.['login'] as { mfaToken: string };

    expect(await verifyMfaToken(mfaToken)).toBe('u1');
    // The critical property: presenting it as a Bearer credential authenticates
    // nothing, so a half-completed sign-in cannot reach the admin area.
    expect(await verifySession(`Bearer ${mfaToken}`)).toBeNull();
  });

  it('rejects wrong credentials with a generic UNAUTHENTICATED error', async () => {
    register({ verify: false });
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
    register({ verify: false });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { login(email:"nope@b.com", password:"x") { token } }',
      contextValue: ctx(null),
    });
    expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
  });
});

import { randomUUID } from 'node:crypto';

import { graphql } from 'graphql';
import { SignJWT } from 'jose';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { signMfaToken, signSession } from '../../../src/server/graphql/auth';
import { DatabaseService } from '../../../src/server/services/database.service';
import { WebauthnService } from '../../../src/server/services/webauthn.service';

afterEach(() => container.reset());

/** Context for a caller holding no session — the state every sign-in step
 *  before `verifyPasskey` is in. */
function anonymousCtx(user: { id: string; role: string } | null = { id: 'u1', role: 'ADMIN' }) {
  return {
    prisma: {
      user: {
        findUnique: async () =>
          user ? { id: user.id, email: 'a@b.com', name: 'A', role: user.role } : null,
      },
    },
    user: null,
    isAuthenticated: false,
  } as never;
}

function authenticatedCtx() {
  const user = { id: 'u1', email: 'a@b.com', name: 'A', role: 'ADMIN' };
  return {
    prisma: { user: { findUnique: async () => user } },
    user,
    isAuthenticated: true,
  } as never;
}

function registerWebauthn(overrides: Record<string, unknown> = {}) {
  const stub = {
    beginAuthentication: vi.fn().mockResolvedValue({ challenge: 'c' }),
    finishAuthentication: vi.fn().mockResolvedValue(undefined),
    claimMfaTicket: vi.fn().mockResolvedValue(undefined),
    consumeMfaTicket: vi.fn().mockResolvedValue(undefined),
    recordMfaFailure: vi.fn().mockResolvedValue(undefined),
    listForUser: vi.fn().mockResolvedValue([]),
    deleteForUser: vi.fn().mockResolvedValue(true),
    beginRegistration: vi.fn().mockResolvedValue({ challenge: 'r' }),
    finishRegistration: vi.fn().mockResolvedValue({ id: 'p1' }),
    ...overrides,
  };
  container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
  container.registerInstance(WebauthnService, stub as never);
  return stub;
}

describe('passkey mutations', () => {
  describe('verifyPasskey', () => {
    // The single most important property of the whole feature: an mfaToken and
    // a session token are signed with the same key, so if `verifyMfaToken` did
    // not enforce `purpose`, a session token would be accepted here and a
    // stolen session could mint fresh ones indefinitely.
    it('refuses a session token presented where an mfaToken is expected', async () => {
      const stub = registerWebauthn();
      const sessionToken = await signSession({ id: 'u1', role: 'ADMIN' });
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { verifyPasskey(mfaToken: "${sessionToken}", response: {}) { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(result.data?.['verifyPasskey']).toBeNull();
      expect(stub.finishAuthentication).not.toHaveBeenCalled();
      expect(stub.claimMfaTicket).not.toHaveBeenCalled();
    });

    // The test above is necessary but not sufficient: `signSession` emits no
    // `jti`, so a session token is also rejected for that reason alone and the
    // assertion would still pass with the purpose check deleted. This one is
    // valid in every respect EXCEPT `purpose`, so it fails the moment that
    // check stops being enforced — verified by mutation.
    it('refuses a token that is well-formed but not minted for MFA', async () => {
      const stub = registerWebauthn();
      const impostor = await new SignJWT({ purpose: 'session' })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(randomUUID())
        .setSubject('u1')
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(new TextEncoder().encode(process.env['JWT_SECRET']));
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { verifyPasskey(mfaToken: "${impostor}", response: {}) { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(result.data?.['verifyPasskey']).toBeNull();
      expect(stub.claimMfaTicket).not.toHaveBeenCalled();
      expect(stub.finishAuthentication).not.toHaveBeenCalled();
    });

    it('refuses a garbage token without touching the service', async () => {
      const stub = registerWebauthn();
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: 'mutation { verifyPasskey(mfaToken: "not-a-token", response: {}) { token } }',
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.finishAuthentication).not.toHaveBeenCalled();
    });

    it('mints a session once the assertion holds, and spends the ticket', async () => {
      const stub = registerWebauthn();
      const mfaToken = await signMfaToken({ id: 'u1' });
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { verifyPasskey(mfaToken: "${mfaToken}", response: {}) { token mfaRequired user { id } } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors).toBeUndefined();
      const data = result.data?.['verifyPasskey'] as { token: string; user: { id: string } };
      expect(typeof data.token).toBe('string');
      expect(data.user.id).toBe('u1');
      expect(stub.consumeMfaTicket).toHaveBeenCalled();
    });

    it('counts a failed assertion against the ticket rather than letting it retry freely', async () => {
      const stub = registerWebauthn({
        finishAuthentication: vi.fn().mockRejectedValue(new Error('Passkey verification failed')),
      });
      const mfaToken = await signMfaToken({ id: 'u1' });
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { verifyPasskey(mfaToken: "${mfaToken}", response: {}) { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.recordMfaFailure).toHaveBeenCalled();
      expect(stub.consumeMfaTicket).not.toHaveBeenCalled();
    });
  });

  describe('beginPasskeyAuthentication', () => {
    // The resolver's own comment promises the caller "learns only that the
    // attempt is over, never whether the account or key exists". Two different
    // underlying causes must therefore be byte-identical on the wire.
    it('returns the same message for a bad token and for an account with no passkeys', async () => {
      registerWebauthn({
        beginAuthentication: vi
          .fn()
          .mockRejectedValue(new Error('No passkeys are registered for this account')),
      });
      const mfaToken = await signMfaToken({ id: 'u1' });
      const { schema } = await import('../../../src/server/graphql/schema');

      const noPasskeys = await graphql({
        schema,
        source: `mutation { beginPasskeyAuthentication(mfaToken: "${mfaToken}") }`,
        contextValue: anonymousCtx(),
      });

      container.reset();
      registerWebauthn();
      const badToken = await graphql({
        schema,
        source: 'mutation { beginPasskeyAuthentication(mfaToken: "garbage") }',
        contextValue: anonymousCtx(),
      });

      expect(noPasskeys.errors?.[0]?.message).toBe(badToken.errors?.[0]?.message);
      expect(noPasskeys.errors?.[0]?.extensions?.['code']).toBe(
        badToken.errors?.[0]?.extensions?.['code']
      );
    });
  });

  describe('authorization scoping', () => {
    it('denies the passkeys query to an anonymous caller without reaching the service', async () => {
      const stub = registerWebauthn();
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: '{ passkeys { id } }',
        contextValue: anonymousCtx(),
      });

      expect(result.errors).toBeDefined();
      expect(stub.listForUser).not.toHaveBeenCalled();
    });

    it('denies deletePasskey to an anonymous caller without reaching the service', async () => {
      const stub = registerWebauthn();
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: 'mutation { deletePasskey(id: "p1") }',
        contextValue: anonymousCtx(),
      });

      expect(result.errors).toBeDefined();
      expect(stub.deleteForUser).not.toHaveBeenCalled();
    });

    it('scopes the passkeys query to the caller, with no argument to ask for another user', async () => {
      const stub = registerWebauthn();
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: '{ passkeys { id } }',
        contextValue: authenticatedCtx(),
      });

      expect(result.errors).toBeUndefined();
      expect(stub.listForUser).toHaveBeenCalledWith('u1');
    });

    it('passes the caller id to deleteForUser so one user cannot remove another’s key', async () => {
      const stub = registerWebauthn();
      const { schema } = await import('../../../src/server/graphql/schema');

      await graphql({
        schema,
        source: 'mutation { deletePasskey(id: "p1") }',
        contextValue: authenticatedCtx(),
      });

      expect(stub.deleteForUser).toHaveBeenCalledWith('u1', 'p1', false);
    });

    it('forwards the explicit confirmation when the last key is being removed', async () => {
      const stub = registerWebauthn();
      const { schema } = await import('../../../src/server/graphql/schema');

      await graphql({
        schema,
        source: 'mutation { deletePasskey(id: "p1", confirmDisableMfa: true) }',
        contextValue: authenticatedCtx(),
      });

      expect(stub.deleteForUser).toHaveBeenCalledWith('u1', 'p1', true);
    });
  });
});

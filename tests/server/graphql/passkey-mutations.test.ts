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
    validateMfaTicket: vi.fn().mockResolvedValue(undefined),
    consumeMfaTicket: vi.fn().mockResolvedValue(undefined),
    recordMfaFailure: vi.fn().mockResolvedValue(undefined),
    hasPasskeys: vi.fn().mockResolvedValue(false),
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
      expect(stub.validateMfaTicket).not.toHaveBeenCalled();
    });

    // The test above is necessary but not sufficient: `signSession` emits no
    // `jti`, so a session token is also rejected for that reason alone and the
    // assertion would still pass with the purpose check deleted. This one is
    // valid in every respect EXCEPT `purpose` — including a well-formed
    // `scope`, without which `readMfaTicket`'s separate scope guard would
    // reject it anyway and this would test nothing. `purpose` is the sole
    // differentiator, so deleting that comparison fails this test — verified by
    // mutation.
    it('refuses a token that is well-formed but not minted for MFA', async () => {
      const stub = registerWebauthn();
      const impostor = await new SignJWT({ purpose: 'session', scope: 'assert' })
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
      expect(stub.validateMfaTicket).not.toHaveBeenCalled();
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
      const mfaToken = await signMfaToken({ id: 'u1' }, 'assert');
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
      const mfaToken = await signMfaToken({ id: 'u1' }, 'assert');
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

  // The bypass this whole scoping scheme exists to stop. Both ticket kinds are
  // minted by one function under one key, so without a scope claim an `assert`
  // ticket — held by someone who knew only the password of an account that
  // ALREADY has a passkey — could be spent on enrolment instead, registering
  // the attacker's own authenticator and minting a session. That is the second
  // factor defeated outright.
  describe('ticket scope is not interchangeable', () => {
    // `hasPasskeys` is deliberately left at its default of FALSE in the two
    // assert-ticket-on-enrolment tests. The resolvers carry a second,
    // independent guard that rejects enrolment whenever a credential already
    // exists; stubbing it true would let that guard produce the same
    // UNAUTHENTICATED and the assertions would hold with the scope check
    // deleted. False removes it from the picture, so the ticket's `scope` claim
    // is the only thing left that can reject the request — which is the
    // property these tests are named for.
    it('refuses to enrol with an assertion ticket', async () => {
      const stub = registerWebauthn();
      const assertTicket = await signMfaToken({ id: 'u1' }, 'assert');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { completePasskeyEnrolment(mfaToken: "${assertTicket}", response: {}, name: "Attacker key") { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(result.data?.['completePasskeyEnrolment']).toBeNull();
      expect(stub.finishRegistration).not.toHaveBeenCalled();
      expect(stub.validateMfaTicket).not.toHaveBeenCalled();
    });

    it('refuses to start enrolment with an assertion ticket', async () => {
      const stub = registerWebauthn();
      const assertTicket = await signMfaToken({ id: 'u1' }, 'assert');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { beginPasskeyEnrolment(mfaToken: "${assertTicket}") }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.beginRegistration).not.toHaveBeenCalled();
      expect(stub.validateMfaTicket).not.toHaveBeenCalled();
    });

    it('refuses to assert with an enrolment ticket', async () => {
      const stub = registerWebauthn();
      const enrolTicket = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { verifyPasskey(mfaToken: "${enrolTicket}", response: {}) { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.finishAuthentication).not.toHaveBeenCalled();
    });

    // Defence in depth: even a correctly-scoped enrolment ticket must not work
    // once a credential exists, since one could be enrolled between minting and
    // spending.
    it('refuses to enrol once the account already has a credential', async () => {
      const stub = registerWebauthn({ hasPasskeys: vi.fn().mockResolvedValue(true) });
      const enrolTicket = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { completePasskeyEnrolment(mfaToken: "${enrolTicket}", response: {}, name: "Second key") { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.finishRegistration).not.toHaveBeenCalled();
    });

    // The same guard on the sibling resolver. It had no test: deleting the
    // `hasPasskeys` check from `beginPasskeyEnrolment` failed nothing, and the
    // omission was invisible in review because the twin above still had one.
    it('refuses to START enrolment once the account already has a credential', async () => {
      const stub = registerWebauthn({ hasPasskeys: vi.fn().mockResolvedValue(true) });
      const enrolTicket = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { beginPasskeyEnrolment(mfaToken: "${enrolTicket}") }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.beginRegistration).not.toHaveBeenCalled();
      expect(stub.validateMfaTicket).not.toHaveBeenCalled();
    });

    // A database outage is not an authentication outcome, and must not be
    // reported as one. Collapsing it into `expiredAttempt()` told the user to
    // retry something that could not work and left no server-side trace, since
    // `asAuthError` is the only thing that logs. It is safe to distinguish
    // because it happens regardless of whether the account exists, so it is not
    // an enumeration oracle.
    it.each([
      ['beginPasskeyEnrolment', 'mutation { beginPasskeyEnrolment(mfaToken: "%TOKEN%") }'],
      [
        'completePasskeyEnrolment',
        'mutation { completePasskeyEnrolment(mfaToken: "%TOKEN%", response: {}, name: "K") { token } }',
      ],
    ])('reports a database failure in %s as an outage, not an expired attempt', async (_l, src) => {
      const stub = registerWebauthn();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const enrolTicket = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: src.replace('%TOKEN%', enrolTicket),
        contextValue: {
          prisma: {
            user: {
              findUnique: () => Promise.reject(new Error('connection pool exhausted')),
            },
          },
          user: null,
          isAuthenticated: false,
        },
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('INTERNAL_SERVER_ERROR');
      expect(result.errors?.[0]?.message).not.toContain('expired');
      expect(stub.validateMfaTicket).not.toHaveBeenCalled();
      expect(stub.finishRegistration).not.toHaveBeenCalled();
    });

    // A ticket can outlive the account it names — deleted between minting and
    // spending — and both enrolment resolvers must answer with the same
    // expired-attempt string rather than distinguishing "no such user".
    it.each([
      ['beginPasskeyEnrolment', 'mutation { beginPasskeyEnrolment(mfaToken: "%TOKEN%") }'],
      [
        'completePasskeyEnrolment',
        'mutation { completePasskeyEnrolment(mfaToken: "%TOKEN%", response: {}, name: "K") { token } }',
      ],
    ])('refuses %s when the ticket names an account that no longer exists', async (_l, source) => {
      const stub = registerWebauthn();
      const enrolTicket = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: source.replace('%TOKEN%', enrolTicket),
        contextValue: anonymousCtx(null),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.beginRegistration).not.toHaveBeenCalled();
      expect(stub.finishRegistration).not.toHaveBeenCalled();
    });
  });

  describe('enrolment during first sign-in', () => {
    it('mints a session once the credential is stored, and spends the ticket', async () => {
      const stub = registerWebauthn();
      const mfaToken = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { completePasskeyEnrolment(mfaToken: "${mfaToken}", response: {}, name: "Key") { token enrolmentRequired user { id } } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors).toBeUndefined();
      const data = result.data?.['completePasskeyEnrolment'] as {
        token: string;
        enrolmentRequired: boolean;
        user: { id: string };
      };
      expect(typeof data.token).toBe('string');
      expect(data.enrolmentRequired).toBe(false);
      expect(data.user.id).toBe('u1');
      expect(stub.finishRegistration).toHaveBeenCalled();
      expect(stub.consumeMfaTicket).toHaveBeenCalled();
    });

    // The session is the thing being withheld until a passkey exists, so a
    // failed ceremony must not hand one over anyway.
    it('issues no session when the ceremony fails', async () => {
      const stub = registerWebauthn({
        finishRegistration: vi.fn().mockRejectedValue(new Error('attestation rejected')),
      });
      const mfaToken = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { completePasskeyEnrolment(mfaToken: "${mfaToken}", response: {}, name: "Key") { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(result.data?.['completePasskeyEnrolment']).toBeNull();
      expect(stub.recordMfaFailure).toHaveBeenCalled();
      expect(stub.consumeMfaTicket).not.toHaveBeenCalled();
    });

    it('refuses a session token presented as the enrolment ticket', async () => {
      const stub = registerWebauthn();
      const sessionToken = await signSession({ id: 'u1', role: 'ADMIN' });
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { completePasskeyEnrolment(mfaToken: "${sessionToken}", response: {}, name: "K") { token } }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.finishRegistration).not.toHaveBeenCalled();
    });

    it('returns registration options for a valid enrolment ticket', async () => {
      const stub = registerWebauthn();
      const mfaToken = await signMfaToken({ id: 'u1' }, 'enrol');
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: `mutation { beginPasskeyEnrolment(mfaToken: "${mfaToken}") }`,
        contextValue: anonymousCtx(),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.['beginPasskeyEnrolment']).toEqual({ challenge: 'r' });
      // The gate runs before the ceremony starts, so a spent, expired or
      // over-budget ticket never reaches `beginRegistration`. It is NOT a
      // replay defence — `validateMfaTicket` marks nothing, so the same token
      // passes as often as it is presented; see the note on the resolver. What
      // bounds replay is the per-subject rate-limit bucket in yoga.ts. An
      // earlier version of this comment claimed the opposite of the resolver it
      // cross-referenced.
      expect(stub.validateMfaTicket).toHaveBeenCalled();
      expect(stub.beginRegistration).toHaveBeenCalled();
    });

    it('refuses to start enrolment on a garbage ticket', async () => {
      const stub = registerWebauthn();
      const { schema } = await import('../../../src/server/graphql/schema');

      const result = await graphql({
        schema,
        source: 'mutation { beginPasskeyEnrolment(mfaToken: "garbage") }',
        contextValue: anonymousCtx(),
      });

      expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
      expect(stub.beginRegistration).not.toHaveBeenCalled();
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
      const mfaToken = await signMfaToken({ id: 'u1' }, 'assert');
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
        source: 'mutation { deletePasskey(id: "p1", confirmRemoveLastPasskey: true) }',
        contextValue: authenticatedCtx(),
      });

      expect(stub.deleteForUser).toHaveBeenCalledWith('u1', 'p1', true);
    });
  });
});

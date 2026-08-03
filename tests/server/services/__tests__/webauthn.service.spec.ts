import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import type { DatabaseService } from '../../../../src/server/services/database.service';
import {
  ExpiredCeremonyError,
  LastPasskeyError,
  WebauthnService,
  relyingPartyFromEnv,
} from '../../../../src/server/services/webauthn.service';

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn().mockResolvedValue({ challenge: 'reg-challenge' }),
  generateAuthenticationOptions: vi.fn().mockResolvedValue({ challenge: 'auth-challenge' }),
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));

const webauthn = await import('@simplewebauthn/server');

/**
 * In-memory stand-ins for the three tables the service owns.
 *
 * Deliberately stateful rather than return-value mocks: the atomicity claims
 * (single-use challenge, conditional counter advance, single-use MFA ticket)
 * are all expressed as "did this conditional write match a row", so a stub that
 * just returns a canned value would prove nothing.
 */
function createPrismaStub() {
  const challenges: Array<Record<string, unknown>> = [];
  const passkeys: Array<Record<string, unknown>> = [];
  const mfaTickets: Array<Record<string, unknown>> = [];

  /** Minimal `where` matcher covering the shapes the service actually uses:
   *  scalar equality plus `{ lt: bigint }` on the counter. */
  const matches = (row: Record<string, unknown>, where: Record<string, unknown>): boolean =>
    Object.entries(where).every(([key, expected]) => {
      const actual = row[key];
      if (expected && typeof expected === 'object' && 'lt' in expected) {
        return (actual as bigint) < (expected as { lt: bigint }).lt;
      }
      return actual === expected;
    });

  const removeWhere = (rows: Array<Record<string, unknown>>, where: Record<string, unknown>) => {
    let count = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (matches(rows[i], where)) {
        rows.splice(i, 1);
        count++;
      }
    }
    return { count };
  };

  return {
    challenges,
    passkeys,
    mfaTickets,
    webauthnChallenge: {
      deleteMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        removeWhere(challenges, where)
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `c${challenges.length + 1}`, createdAt: new Date(), ...data };
        challenges.push(row);
        return row;
      }),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) =>
          [...challenges].reverse().find(c => matches(c, where)) ?? null
      ),
    },
    passkey: {
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        passkeys.filter(p => matches(p, where))
      ),
      count: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) =>
          passkeys.filter(p => matches(p, where)).length
      ),
      findUnique: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) =>
          passkeys.find(p => matches(p, where)) ?? null
      ),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) =>
          passkeys.find(p => matches(p, where)) ?? null
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `p${passkeys.length + 1}`, ...data };
        passkeys.push(row);
        return row;
      }),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          const hits = passkeys.filter(p => matches(p, where));
          hits.forEach(row => Object.assign(row, data));
          return { count: hits.length };
        }
      ),
      deleteMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        removeWhere(passkeys, where)
      ),
    },
    mfaTicket: {
      upsert: vi.fn(
        async ({ where, create }: { where: { id: string }; create: Record<string, unknown> }) => {
          const found = mfaTickets.find(t => t['id'] === where.id);
          if (found) {
            return found;
          }
          const row = { failures: 0, consumedAt: null, createdAt: new Date(), ...create };
          mfaTickets.push(row);
          return row;
        }
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          const hits = mfaTickets.filter(t => matches(t, where));
          hits.forEach(row => {
            for (const [key, value] of Object.entries(data)) {
              if (value && typeof value === 'object' && 'increment' in value) {
                row[key] = (row[key] as number) + (value as { increment: number }).increment;
              } else {
                row[key] = value;
              }
            }
          });
          return { count: hits.length };
        }
      ),
    },
  };
}

const USER = { id: 'u1', email: 'a@b.com', name: 'A' } as never;

describe('WebauthnService', () => {
  let prisma: ReturnType<typeof createPrismaStub>;
  let service: WebauthnService;

  beforeEach(() => {
    prisma = createPrismaStub();
    service = new WebauthnService({ getClient: () => prisma } as unknown as DatabaseService);
  });

  afterEach(() => vi.clearAllMocks());

  describe('relyingPartyFromEnv', () => {
    it('defaults to the canonical production origin', () => {
      expect(relyingPartyFromEnv({})).toEqual({
        id: 'quinnjr.dev',
        name: 'quinnjr.dev',
        origins: ['https://quinnjr.dev'],
      });
    });

    it('accepts a comma-separated origin list for local development', () => {
      const rp = relyingPartyFromEnv({
        WEBAUTHN_RP_ID: 'localhost',
        WEBAUTHN_ORIGIN: 'http://localhost:4200, http://localhost:4000',
      });
      expect(rp.id).toBe('localhost');
      expect(rp.origins).toEqual(['http://localhost:4200', 'http://localhost:4000']);
    });
  });

  describe('hasPasskeys', () => {
    it('is false for an account with none, which is what leaves login single-factor', async () => {
      expect(await service.hasPasskeys('u1')).toBe(false);
    });

    it('is true once one is enrolled', async () => {
      prisma.passkeys.push({ id: 'p1', userId: 'u1' });
      expect(await service.hasPasskeys('u1')).toBe(true);
    });
  });

  describe('registration', () => {
    it('excludes already-enrolled credentials so an authenticator cannot double-register', async () => {
      prisma.passkeys.push({ id: 'p1', userId: 'u1', credentialId: 'cred-1', transports: ['usb'] });

      await service.beginRegistration(USER);

      const opts = vi.mocked(webauthn.generateRegistrationOptions).mock.calls[0]?.[0];
      expect(opts?.excludeCredentials).toEqual([{ id: 'cred-1', transports: ['usb'] }]);
      expect(opts?.authenticatorSelection?.userVerification).toBe('required');
    });

    it('stores the challenge server-side rather than trusting the client', async () => {
      await service.beginRegistration(USER);
      expect(prisma.challenges).toHaveLength(1);
      expect(prisma.challenges[0]).toMatchObject({
        userId: 'u1',
        challenge: 'reg-challenge',
        kind: 'REGISTRATION',
      });
    });

    it('persists the credential returned by a verified attestation', async () => {
      await service.beginRegistration(USER);
      vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'cred-new',
            publicKey: new Uint8Array([1, 2, 3]),
            counter: 4,
            transports: ['internal'],
          },
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
        },
      } as never);

      const created = await service.finishRegistration(USER, {} as never, ' Yubikey ');

      expect(created).toMatchObject({
        credentialId: 'cred-new',
        counter: 4n,
        deviceType: 'multiDevice',
        backedUp: true,
        name: 'Yubikey',
      });
    });

    it('requires user verification when verifying an attestation', async () => {
      await service.beginRegistration(USER);
      vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'c', publicKey: new Uint8Array([1]), counter: 0, transports: [] },
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
        },
      } as never);

      await service.finishRegistration(USER, {} as never, 'k');

      const opts = vi.mocked(webauthn.verifyRegistrationResponse).mock.calls[0]?.[0];
      expect(opts?.requireUserVerification).toBe(true);
      expect(opts?.expectedRPID).toBe('quinnjr.dev');
      expect(opts?.expectedOrigin).toEqual(['https://quinnjr.dev']);
    });

    it('rejects an attestation the library could not verify', async () => {
      await service.beginRegistration(USER);
      vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({
        verified: false,
      } as never);

      await expect(service.finishRegistration(USER, {} as never, 'x')).rejects.toThrow(
        /could not be verified/
      );
      expect(prisma.passkeys).toHaveLength(0);
    });
  });

  describe('authentication', () => {
    beforeEach(() => {
      prisma.passkeys.push({
        id: 'p1',
        userId: 'u1',
        credentialId: 'cred-1',
        publicKey: Buffer.from([9]),
        counter: 7n,
        transports: ['internal'],
      });
    });

    it('refuses to start when the account has no credential', async () => {
      await expect(service.beginAuthentication('nobody')).rejects.toThrow(/No passkeys/);
    });

    // The security of clone detection and RP binding lives ENTIRELY in the
    // arguments handed to the library — the service itself makes no crypto
    // decision. Without these assertions the suite still passes if the stored
    // counter is replaced by 0, user verification is dropped, or the expected
    // RP ID points at an attacker's domain.
    it('hands the library the stored counter, the RP binding, and required UV', async () => {
      await service.beginAuthentication('u1');
      vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 12 },
      } as never);

      await service.finishAuthentication('u1', { id: 'cred-1' } as never);

      const opts = vi.mocked(webauthn.verifyAuthenticationResponse).mock.calls[0]?.[0];
      expect(opts?.credential.counter).toBe(7);
      expect(opts?.credential.id).toBe('cred-1');
      expect(opts?.expectedRPID).toBe('quinnjr.dev');
      expect(opts?.expectedOrigin).toEqual(['https://quinnjr.dev']);
      expect(opts?.requireUserVerification).toBe(true);
      expect(opts?.expectedChallenge).toBe('auth-challenge');
    });

    it('only one of two racing assertions advances the counter', async () => {
      await service.beginAuthentication('u1');
      vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 12 },
      } as never);

      // Both carry the same captured assertion. The challenge is single-use and
      // the counter advance is conditional, so exactly one may succeed.
      const results = await Promise.allSettled([
        service.finishAuthentication('u1', { id: 'cred-1' } as never),
        service.finishAuthentication('u1', { id: 'cred-1' } as never),
      ]);

      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
      expect(prisma.passkeys[0]).toMatchObject({ counter: 12n });
    });

    it('advances the stored signature counter on success', async () => {
      await service.beginAuthentication('u1');
      vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 12 },
      } as never);

      await service.finishAuthentication('u1', { id: 'cred-1' } as never);

      expect(prisma.passkeys[0]).toMatchObject({ counter: 12n });
      expect(prisma.passkeys[0]?.['lastUsedAt']).toBeInstanceOf(Date);
    });

    it('consumes the challenge so a captured assertion cannot be replayed', async () => {
      await service.beginAuthentication('u1');
      vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 12 },
      } as never);

      await service.finishAuthentication('u1', { id: 'cred-1' } as never);
      expect(prisma.challenges).toHaveLength(0);

      // Second use of the same assertion finds no pending challenge.
      await expect(service.finishAuthentication('u1', { id: 'cred-1' } as never)).rejects.toThrow(
        /expired/
      );
    });

    it('rejects an expired challenge', async () => {
      await service.beginAuthentication('u1');
      prisma.challenges[0]['expiresAt'] = new Date(Date.now() - 1000);

      await expect(service.finishAuthentication('u1', { id: 'cred-1' } as never)).rejects.toThrow(
        /expired/
      );
    });

    it('refuses a credential belonging to a different account', async () => {
      prisma.passkeys.push({
        id: 'p2',
        userId: 'someone-else',
        credentialId: 'cred-other',
        publicKey: Buffer.from([1]),
        counter: 0n,
        transports: [],
      });
      await service.beginAuthentication('u1');

      await expect(
        service.finishAuthentication('u1', { id: 'cred-other' } as never)
      ).rejects.toThrow(/not registered for this account/);
    });

    it('does not advance the counter when verification fails', async () => {
      await service.beginAuthentication('u1');
      vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({
        verified: false,
      } as never);

      await expect(service.finishAuthentication('u1', { id: 'cred-1' } as never)).rejects.toThrow(
        /verification failed/
      );
      expect(prisma.passkeys[0]).toMatchObject({ counter: 7n });
    });
  });

  describe('deleteForUser', () => {
    beforeEach(() => {
      prisma.passkeys.push({ id: 'p1', userId: 'u1', credentialId: 'cred-1' });
    });

    it('removes one of several without needing confirmation', async () => {
      prisma.passkeys.push({ id: 'p2', userId: 'u1', credentialId: 'cred-2' });

      expect(await service.deleteForUser('u1', 'p1')).toBe(true);
      expect(prisma.passkeys.map(p => p['id'])).toEqual(['p2']);
    });

    it("reports failure rather than touching another user's passkey", async () => {
      expect(await service.deleteForUser('someone-else', 'p1')).toBe(false);
      expect(prisma.passkeys).toHaveLength(1);
    });

    // Removing the last credential turns the second factor off entirely, so it
    // must not be reachable by a single unconfirmed call — otherwise a stolen
    // session token quietly downgrades the account to password-only.
    it('refuses to remove the last passkey without explicit confirmation', async () => {
      await expect(service.deleteForUser('u1', 'p1')).rejects.toThrow(LastPasskeyError);
      expect(prisma.passkeys).toHaveLength(1);
    });

    it('removes the last passkey when the caller confirms the downgrade', async () => {
      expect(await service.deleteForUser('u1', 'p1', true)).toBe(true);
      expect(prisma.passkeys).toHaveLength(0);
    });

    it('checks ownership before the last-passkey guard, so it cannot probe others', async () => {
      // 'someone-else' owns nothing; the guard must not fire and leak that u1
      // has exactly one credential.
      await expect(service.deleteForUser('someone-else', 'p1')).resolves.toBe(false);
    });
  });

  describe('MFA tickets', () => {
    const ticket = () => ({
      jti: 't1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    it('accepts a fresh ticket and creates its row lazily', async () => {
      await expect(service.claimMfaTicket(ticket())).resolves.toBeUndefined();
      expect(prisma.mfaTickets).toHaveLength(1);
    });

    it('rejects a ticket that was already spent', async () => {
      await service.claimMfaTicket(ticket());
      await service.consumeMfaTicket('t1');

      await expect(service.claimMfaTicket(ticket())).rejects.toThrow(ExpiredCeremonyError);
    });

    it('lets only one of two racing requests spend the same ticket', async () => {
      await service.claimMfaTicket(ticket());

      const results = await Promise.allSettled([
        service.consumeMfaTicket('t1'),
        service.consumeMfaTicket('t1'),
      ]);

      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
    });

    it('burns a ticket after repeated failed assertions', async () => {
      await service.claimMfaTicket(ticket());
      for (let i = 0; i < 5; i++) {
        await service.recordMfaFailure('t1');
      }

      await expect(service.claimMfaTicket(ticket())).rejects.toThrow(ExpiredCeremonyError);
    });

    it('rejects an expired ticket', async () => {
      await expect(
        service.claimMfaTicket({ jti: 't2', userId: 'u1', expiresAt: new Date(Date.now() - 1) })
      ).rejects.toThrow(ExpiredCeremonyError);
    });
  });
});

import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import type { DatabaseService } from '../../../../src/server/services/database.service';
import {
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

/** In-memory stand-ins for the two tables the service owns. */
function createPrismaStub() {
  const challenges: Array<Record<string, unknown>> = [];
  const passkeys: Array<Record<string, unknown>> = [];

  return {
    challenges,
    passkeys,
    webauthnChallenge: {
      deleteMany: vi.fn(async ({ where }: { where: { userId: string; kind: string } }) => {
        for (let i = challenges.length - 1; i >= 0; i--) {
          if (challenges[i]['userId'] === where.userId && challenges[i]['kind'] === where.kind) {
            challenges.splice(i, 1);
          }
        }
        return { count: 0 };
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `c${challenges.length + 1}`, createdAt: new Date(), ...data };
        challenges.push(row);
        return row;
      }),
      findFirst: vi.fn(
        async ({ where }: { where: { userId: string; kind: string } }) =>
          [...challenges]
            .reverse()
            .find(c => c['userId'] === where.userId && c['kind'] === where.kind) ?? null
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const i = challenges.findIndex(c => c['id'] === where.id);
        if (i >= 0) {
          challenges.splice(i, 1);
        }
        return {};
      }),
    },
    passkey: {
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
        passkeys.filter(p => p['userId'] === where.userId)
      ),
      count: vi.fn(
        async ({ where }: { where: { userId: string } }) =>
          passkeys.filter(p => p['userId'] === where.userId).length
      ),
      findUnique: vi.fn(
        async ({ where }: { where: { credentialId: string } }) =>
          passkeys.find(p => p['credentialId'] === where.credentialId) ?? null
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `p${passkeys.length + 1}`, ...data };
        passkeys.push(row);
        return row;
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const row = passkeys.find(p => p['id'] === where.id);
          Object.assign(row ?? {}, data);
          return row;
        }
      ),
      deleteMany: vi.fn(async ({ where }: { where: { id: string; userId: string } }) => {
        const i = passkeys.findIndex(p => p['id'] === where.id && p['userId'] === where.userId);
        if (i >= 0) {
          passkeys.splice(i, 1);
          return { count: 1 };
        }
        return { count: 0 };
      }),
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

    it('removes the caller’s own passkey', async () => {
      expect(await service.deleteForUser('u1', 'p1')).toBe(true);
      expect(prisma.passkeys).toHaveLength(0);
    });

    it("reports failure rather than touching another user's passkey", async () => {
      expect(await service.deleteForUser('someone-else', 'p1')).toBe(false);
      expect(prisma.passkeys).toHaveLength(1);
    });
  });
});

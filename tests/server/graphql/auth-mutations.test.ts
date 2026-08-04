import { graphql } from 'graphql';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { readMfaTicket, verifyMfaToken, verifySession } from '../../../src/server/graphql/auth';
import { DatabaseService } from '../../../src/server/services/database.service';
import { PasswordService } from '../../../src/server/services/password.service';

afterEach(() => container.reset());

interface UserRow {
  id: string;
  role: string;
  /** Enrolled passkey count, delivered by the same query as the user row. */
  passkeys?: number;
  passwordHash?: string;
}

// `findUnique` returns a user row (with passwordHash and the passkey count the
// resolver folds into this single query) or null.
function ctx(userRow: UserRow | null) {
  return {
    prisma: {
      user: {
        findUnique: async () =>
          userRow
            ? {
                id: userRow.id,
                email: 'a@b.com',
                name: 'A',
                role: userRow.role,
                passwordHash: userRow.passwordHash ?? 'h',
                _count: { passkeys: userRow.passkeys ?? 0 },
              }
            : null,
      },
    },
    user: null,
    isAuthenticated: false,
  } as never;
}

/** Registers the collaborators `login` resolves lazily. Omitting `verify`
 *  leaves the real PasswordService in place. */
function register(opts: { verify?: boolean } = {}) {
  if (opts.verify !== undefined) {
    container.registerInstance(PasswordService, {
      verify: vi.fn().mockResolvedValue(opts.verify),
    } as never);
  }
  container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
}

describe('login mutation', () => {
  // A second factor is mandatory, so an account with no passkey does not get a
  // session either — it gets a ticket to enrol with. Withholding it here is
  // what makes the requirement real: a UI-only prompt would be skippable by
  // any client that simply kept the token.
  it('withholds the session and demands enrolment when no passkey exists', async () => {
    register({ verify: true });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source:
        'mutation { login(email:"a@b.com", password:"pw") { token user { id } mfaRequired enrolmentRequired mfaToken } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN', passkeys: 0 }),
    });
    expect(result.errors).toBeUndefined();
    const data = result.data?.['login'] as {
      token: string | null;
      user: unknown;
      mfaRequired: boolean;
      enrolmentRequired: boolean;
      mfaToken: string;
    };
    expect(data.token).toBeNull();
    expect(data.user).toBeNull();
    expect(data.mfaRequired).toBe(false);
    expect(data.enrolmentRequired).toBe(true);
    // The scope is the load-bearing half of the ticket, not the flags: an
    // `assert` ticket issued here would be spendable on `verifyPasskey` against
    // an account with no credential. Asserting only the booleans left
    // `signMfaToken(user, 'enrol')` free to become `'assert'` with no test
    // failing anywhere in the suite.
    expect((await readMfaTicket(data.mfaToken))?.scope).toBe('enrol');
  });

  it('withholds the session and demands a passkey once one is enrolled', async () => {
    register({ verify: true });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source:
        'mutation { login(email:"a@b.com", password:"pw") { token user { id } mfaRequired enrolmentRequired mfaToken } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN', passkeys: 1 }),
    });
    expect(result.errors).toBeUndefined();
    const data = result.data?.['login'] as {
      token: string | null;
      user: unknown;
      mfaRequired: boolean;
      enrolmentRequired: boolean;
      mfaToken: string;
    };
    // A correct password alone must not yield a session.
    expect(data.token).toBeNull();
    expect(data.user).toBeNull();
    expect(data.mfaRequired).toBe(true);
    expect(data.enrolmentRequired).toBe(false);
    // See the enrolment case above: the scope is what stops this ticket being
    // spent on enrolling a fresh authenticator instead of asserting the
    // existing one, which is the bypass the scoping scheme exists to close.
    expect((await readMfaTicket(data.mfaToken))?.scope).toBe('assert');
  });

  it('issues an mfaToken that identifies the user but is not a session', async () => {
    register({ verify: true });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { login(email:"a@b.com", password:"pw") { mfaToken } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN', passkeys: 1 }),
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

  // Run in ONE test and compared to each other rather than each to its own
  // literal. Split across two tests, both would keep passing if the two paths
  // drifted apart in wording — and the wording being identical IS the property:
  // a caller who can tell "no such account" from "wrong password" can enumerate
  // registered emails.
  it('answers an unknown email and a wrong password identically', async () => {
    const { schema } = await import('../../../src/server/graphql/schema');

    register({ verify: false });
    const wrongPassword = await graphql({
      schema,
      source: 'mutation { login(email:"a@b.com", password:"bad") { token } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN' }),
    });

    container.reset();
    register({ verify: false });
    const unknownEmail = await graphql({
      schema,
      source: 'mutation { login(email:"nope@b.com", password:"x") { token } }',
      contextValue: ctx(null),
    });

    expect(unknownEmail.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
    expect(unknownEmail.errors?.[0]?.extensions).toEqual(wrongPassword.errors?.[0]?.extensions);
    expect(unknownEmail.errors?.[0]?.message).toBe(wrongPassword.errors?.[0]?.message);
  });

  // The `passwordHash` column was backfilled with `''` for pre-existing rows
  // (prisma/migrations/20260803175852_users_password_hash), and that migration
  // rests on this behaving as fail-closed. `''` is not nullish, so it is NOT
  // swapped for DUMMY_PASSWORD_HASH — the real PasswordService is left
  // registered here so the argon2 verify of an empty hash is genuinely
  // exercised rather than mocked away.
  it('refuses to authenticate a row whose passwordHash was backfilled empty', async () => {
    register();
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { login(email:"a@b.com", password:"") { token } }',
      contextValue: ctx({ id: 'u1', role: 'ADMIN', passwordHash: '' }),
    });
    expect(result.errors?.[0]?.extensions?.['code']).toBe('UNAUTHENTICATED');
    expect(result.errors?.[0]?.message).toBe('Invalid email or password');
  });
});

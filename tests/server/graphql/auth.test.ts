import { describe, it, expect } from 'vitest';

import { signSession, verifySession } from '../../../src/server/graphql/auth';

describe('session JWT', () => {
  it('signs and verifies a session token', async () => {
    const token = await signSession({ id: 'u1', role: 'ADMIN' });
    const session = await verifySession(`Bearer ${token}`);
    expect(session?.sub).toBe('u1');
    expect(session?.role).toBe('ADMIN');
  });

  it('returns null for a missing or malformed token', async () => {
    expect(await verifySession(null)).toBeNull();
    expect(await verifySession('Bearer not-a-jwt')).toBeNull();
  });

  it('returns null for a token with an invalid signature', async () => {
    expect(await verifySession('Bearer aaa.bbb.ccc')).toBeNull();
  });
});

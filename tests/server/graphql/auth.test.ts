import { describe, it, expect } from 'vitest';
import { verifyAccessToken } from '../../../src/server/graphql/auth';

describe('verifyAccessToken', () => {
  it('returns null for a missing token', async () => {
    expect(await verifyAccessToken(null)).toBeNull();
  });

  it('returns null for a malformed token', async () => {
    expect(await verifyAccessToken('Bearer not-a-jwt')).toBeNull();
  });
});

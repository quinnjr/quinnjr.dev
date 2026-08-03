import { describe, it, expect } from 'vitest';

import 'reflect-metadata';
import { PasswordService } from '../../../src/server/services/password.service';

describe('PasswordService', () => {
  const svc = new PasswordService();

  it('hashes and verifies a correct password', async () => {
    const hash = await svc.hash('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await svc.verify(hash, 'correct horse battery staple')).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await svc.hash('s3cret');
    expect(await svc.verify(hash, 'wrong')).toBe(false);
  });

  it('returns false (no throw) for a malformed hash', async () => {
    expect(await svc.verify('not-a-hash', 'whatever')).toBe(false);
  });

  // prisma/migrations/20260803175852_users_password_hash backfills existing
  // rows with `''` and names this method as the reason that is safe: an empty
  // hash must authenticate nobody, including someone submitting an empty
  // password.
  it('returns false for an empty hash, so the migration backfill is fail-closed', async () => {
    expect(await svc.verify('', 'anything')).toBe(false);
    expect(await svc.verify('', '')).toBe(false);
  });
});

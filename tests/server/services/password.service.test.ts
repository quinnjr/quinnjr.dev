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
});

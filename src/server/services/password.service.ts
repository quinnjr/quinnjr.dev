import { hash as argonHash, verify as argonVerify, Algorithm } from '@node-rs/argon2';
import { singleton } from 'tsyringe';

/** Argon2id password hashing/verification. */
@singleton()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argonHash(plain, { algorithm: Algorithm.Argon2id });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argonVerify(hash, plain);
    } catch {
      return false;
    }
  }
}

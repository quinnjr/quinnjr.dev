import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { inject, singleton } from 'tsyringe';

import type { Passkey, User } from '../../generated/prisma/client';

import { DatabaseService } from './database.service';

/**
 * Relying Party identity.
 *
 * `rpId` must be the registrable domain the site is served from — a credential
 * created under one rpId cannot be asserted under another, so changing this
 * invalidates every enrolled passkey. `origin` is compared verbatim against the
 * browser's, so it carries the scheme and any non-default port.
 */
export interface RelyingParty {
  id: string;
  name: string;
  origins: string[];
}

export function relyingPartyFromEnv(env: NodeJS.ProcessEnv = process.env): RelyingParty {
  const id = env['WEBAUTHN_RP_ID'] ?? 'quinnjr.dev';
  const origins = (env['WEBAUTHN_ORIGIN'] ?? `https://${id}`)
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  return { id, name: env['WEBAUTHN_RP_NAME'] ?? 'quinnjr.dev', origins };
}

/** How long a pending ceremony stays valid. Long enough to pick a key, short
 *  enough that an abandoned challenge is not left sitting around. */
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

@singleton()
export class WebauthnService {
  private readonly rp: RelyingParty;

  constructor(@inject(DatabaseService) private readonly db: DatabaseService) {
    this.rp = relyingPartyFromEnv();
  }

  private get prisma() {
    return this.db.getClient();
  }

  /** Passkeys belonging to a user, newest first. */
  listForUser(userId: string): Promise<Passkey[]> {
    return this.prisma.passkey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** True when the user has at least one credential, i.e. the second factor
   *  is armed for them. */
  async hasPasskeys(userId: string): Promise<boolean> {
    return (await this.prisma.passkey.count({ where: { userId } })) > 0;
  }

  async beginRegistration(user: User): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const existing = await this.listForUser(user.id);

    const options = await generateRegistrationOptions({
      rpName: this.rp.name,
      rpID: this.rp.id,
      userName: user.email,
      userDisplayName: user.name,
      // The user id is opaque to the authenticator; sending the database id
      // rather than the email keeps a renamed account's credentials valid.
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      // Stops the same authenticator enrolling twice and silently shadowing
      // its earlier credential.
      excludeCredentials: existing.map(passkey => ({
        id: passkey.credentialId,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        // This credential *is* the second factor, so the authenticator must
        // prove the user was present and verified, not merely reachable.
        userVerification: 'required',
      },
    });

    await this.storeChallenge(user.id, options.challenge, 'REGISTRATION');
    return options;
  }

  async finishRegistration(
    user: User,
    response: RegistrationResponseJSON,
    name: string
  ): Promise<Passkey> {
    const challenge = await this.consumeChallenge(user.id, 'REGISTRATION');

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.rp.origins,
      expectedRPID: this.rp.id,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      throw new Error('Passkey registration could not be verified');
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    return this.prisma.passkey.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports ?? [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        name: name.trim() || 'Passkey',
      },
    });
  }

  async beginAuthentication(userId: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const credentials = await this.listForUser(userId);
    if (credentials.length === 0) {
      throw new Error('No passkeys are registered for this account');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rp.id,
      // Scoped to this account's credentials: the password step already
      // identified the user, so there is nothing to discover.
      allowCredentials: credentials.map(passkey => ({
        id: passkey.credentialId,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: 'required',
    });

    await this.storeChallenge(userId, options.challenge, 'AUTHENTICATION');
    return options;
  }

  /**
   * Verify an assertion and advance the stored signature counter.
   *
   * A counter that fails to move forward is the documented signal of a cloned
   * authenticator, so verification is delegated to the library with the stored
   * value and the result is persisted.
   */
  async finishAuthentication(userId: string, response: AuthenticationResponseJSON): Promise<void> {
    const challenge = await this.consumeChallenge(userId, 'AUTHENTICATION');

    const passkey = await this.prisma.passkey.findUnique({
      where: { credentialId: response.id },
    });
    if (passkey?.userId !== userId) {
      throw new Error('That passkey is not registered for this account');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.rp.origins,
      expectedRPID: this.rp.id,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
    });

    if (!verification.verified) {
      throw new Error('Passkey verification failed');
    }

    await this.prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });
  }

  /** Removes one of the user's own passkeys. Returns false when the id does
   *  not belong to them, so a caller cannot probe for others' credentials. */
  async deleteForUser(userId: string, passkeyId: string): Promise<boolean> {
    const { count } = await this.prisma.passkey.deleteMany({
      where: { id: passkeyId, userId },
    });
    return count > 0;
  }

  private async storeChallenge(
    userId: string,
    challenge: string,
    kind: 'REGISTRATION' | 'AUTHENTICATION'
  ): Promise<void> {
    // One pending ceremony of each kind per user: starting a new one abandons
    // the old, so a stale challenge cannot be completed later.
    await this.prisma.webauthnChallenge.deleteMany({ where: { userId, kind } });
    await this.prisma.webauthnChallenge.create({
      data: {
        userId,
        challenge,
        kind,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });
  }

  /**
   * Reads and deletes the pending challenge in one step — a challenge is
   * single-use by definition, and deleting before verification means a
   * failed attempt cannot be retried against the same value.
   */
  private async consumeChallenge(
    userId: string,
    kind: 'REGISTRATION' | 'AUTHENTICATION'
  ): Promise<string> {
    const pending = await this.prisma.webauthnChallenge.findFirst({
      where: { userId, kind },
      orderBy: { createdAt: 'desc' },
    });

    if (pending) {
      await this.prisma.webauthnChallenge.delete({ where: { id: pending.id } });
    }

    if (!pending || pending.expiresAt.getTime() < Date.now()) {
      throw new Error('This sign-in attempt has expired. Start again.');
    }

    return pending.challenge;
  }
}

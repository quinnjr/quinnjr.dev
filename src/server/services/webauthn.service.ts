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

/** Failed assertions a single MFA ticket tolerates before it is burned. A
 *  leaked ticket is then worth a handful of guesses, not five minutes of them. */
const MFA_MAX_FAILURES = 5;

/**
 * Raised whenever the ceremony state a caller depends on is gone: no pending
 * challenge, an expired one, a challenge another request consumed first, or a
 * spent MFA ticket. Distinct from a verification failure so the resolver can
 * pick the right user-facing message without matching on strings.
 */
export class ExpiredCeremonyError extends Error {
  constructor(message = 'This sign-in attempt has expired. Start again.') {
    super(message);
    this.name = 'ExpiredCeremonyError';
  }
}

/**
 * Raised when deleting a passkey would leave the account with none.
 *
 * This does NOT demote the account to password-only — the second factor is
 * mandatory, so the next sign-in withholds the session and demands a fresh
 * enrolment instead. The confirmation exists because that is still a
 * consequential state to enter unintentionally: on a browser or device without
 * WebAuthn the owner cannot complete the enrolment and is locked out.
 */
export class LastPasskeyError extends Error {
  constructor() {
    super('Removing this passkey would require enrolling a new one at the next sign-in');
    this.name = 'LastPasskeyError';
  }
}

/** The server-side identity of one MFA ticket, read from its JWT claims. */
export interface MfaTicketClaims {
  jti: string;
  userId: string;
  expiresAt: Date;
}

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
      throw new ExpiredCeremonyError('No passkeys are registered for this account');
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

    const { newCounter } = verification.authenticationInfo;

    // Conditional write, not a plain update: two assertions racing here would
    // otherwise both read counter N, both verify, and the later write would
    // land last — leaving the stored counter where a clone could keep replaying
    // from. Requiring the row to still be below the new value means exactly one
    // of them advances it. Authenticators that do not implement a counter
    // report 0 forever, and `lt` can never hold for those, so they skip the
    // guard (the library has already rejected any real regression).
    const { count } = await this.prisma.passkey.updateMany({
      where:
        newCounter > 0
          ? { id: passkey.id, counter: { lt: BigInt(newCounter) } }
          : { id: passkey.id },
      data: {
        counter: BigInt(newCounter),
        lastUsedAt: new Date(),
      },
    });

    if (count === 0) {
      throw new Error('Passkey verification failed');
    }
  }

  /**
   * Removes one of the user's own passkeys. Returns false when the id does not
   * belong to them, so a caller cannot probe for others' credentials.
   *
   * Removing the last credential does not turn the second factor off — it
   * cannot be turned off — but it does put the account into the state where
   * the next sign-in must enrol a new one. That is refused unless the caller
   * says so explicitly, because anyone holding a stolen session token could
   * otherwise strip the owner's credential and be first to enrol against the
   * resulting empty account.
   */
  async deleteForUser(
    userId: string,
    passkeyId: string,
    confirmRemoveLastPasskey = false
  ): Promise<boolean> {
    const target = await this.prisma.passkey.findFirst({ where: { id: passkeyId, userId } });
    if (!target) {
      return false;
    }

    if (
      !confirmRemoveLastPasskey &&
      (await this.prisma.passkey.count({ where: { userId } })) === 1
    ) {
      throw new LastPasskeyError();
    }

    const { count } = await this.prisma.passkey.deleteMany({
      where: { id: passkeyId, userId },
    });
    return count > 0;
  }

  /**
   * Bind an MFA ticket to server-side state and assert it is still usable.
   *
   * The row is created on first sight rather than at login, so nothing in the
   * password path has to know about it. Rejecting a consumed, burned, or
   * expired ticket here is what stops one leaked token from driving unlimited
   * ceremonies for its whole five-minute life.
   */
  /**
   * Register the ticket server-side if this is its first use, and refuse it if
   * it is spent, expired, over its failure budget, or bound to another user.
   *
   * Named `validate`, not `claim`: it deliberately marks nothing. Calling it
   * twice with the same ticket succeeds twice. Single-use is enforced by
   * `consumeMfaTicket`, and the number of attempts by `recordMfaFailure`
   * against `MFA_MAX_FAILURES` — this call is the gate that reads both.
   */
  async validateMfaTicket(ticket: MfaTicketClaims): Promise<void> {
    const row = await this.prisma.mfaTicket.upsert({
      where: { id: ticket.jti },
      create: { id: ticket.jti, userId: ticket.userId, expiresAt: ticket.expiresAt },
      update: {},
    });

    if (
      row.userId !== ticket.userId ||
      row.consumedAt !== null ||
      row.failures >= MFA_MAX_FAILURES ||
      row.expiresAt.getTime() < Date.now()
    ) {
      throw new ExpiredCeremonyError();
    }
  }

  /** Count a failed assertion against the ticket. `MFA_MAX_FAILURES` of these
   *  and `validateMfaTicket` stops accepting it. */
  async recordMfaFailure(jti: string): Promise<void> {
    await this.prisma.mfaTicket.updateMany({
      where: { id: jti },
      data: { failures: { increment: 1 } },
    });
  }

  /**
   * Spend the ticket. Conditional on it still being unspent so that two
   * requests carrying the same token cannot both mint a session — the loser
   * gets `count === 0` and is turned away.
   */
  async consumeMfaTicket(jti: string): Promise<void> {
    const { count } = await this.prisma.mfaTicket.updateMany({
      where: { id: jti, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (count === 0) {
      throw new ExpiredCeremonyError();
    }
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
   * Claims the pending challenge, deleting it before verification so a failed
   * attempt cannot be retried against the same value.
   *
   * The delete is the lock, not a formality. A plain read-then-delete leaves a
   * window in which two concurrent requests both see the same row and both
   * proceed — enough to replay a captured assertion. `deleteMany` reports how
   * many rows it actually removed, so of N racers exactly one gets `count === 1`
   * and the rest are told the attempt is over.
   */
  private async consumeChallenge(
    userId: string,
    kind: 'REGISTRATION' | 'AUTHENTICATION'
  ): Promise<string> {
    const pending = await this.prisma.webauthnChallenge.findFirst({
      where: { userId, kind },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending) {
      throw new ExpiredCeremonyError();
    }

    const { count } = await this.prisma.webauthnChallenge.deleteMany({
      where: { id: pending.id },
    });

    if (count === 0 || pending.expiresAt.getTime() < Date.now()) {
      throw new ExpiredCeremonyError();
    }

    return pending.challenge;
  }
}

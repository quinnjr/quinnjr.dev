import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/**
 * Thin wrapper over the WebAuthn browser ceremonies.
 *
 * `@simplewebauthn/browser` is loaded through a dynamic import so the library
 * stays out of the initial bundle — it touches `navigator.credentials` at
 * module scope, which does not exist on the server. The import alone only
 * defers the load, so the ceremony methods also refuse to run off-browser
 * rather than relying on every caller to gate on `isSupported()` first.
 */
/* eslint-disable security/detect-object-injection --
 * The only dynamic key is a two-value literal union ('name' | 'message'),
 * never caller-controlled input.
 */

/** Reads a string property off an unknown rejection without assuming a class. */
function readProperty(error: unknown, key: 'name' | 'message'): string {
  if (typeof error !== 'object' || error === null || !(key in error)) {
    return '';
  }
  const value = (error as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

@Injectable({ providedIn: 'root' })
export class PasskeyService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Whether this browser can perform a WebAuthn ceremony at all. Callers use
   * it to avoid offering an enrolment button that could only ever fail.
   *
   * Matches the library's own check: a `PublicKeyCredential` that is present
   * but not constructible is not a usable implementation.
   */
  isSupported(): boolean {
    return this.browser && typeof PublicKeyCredential === 'function';
  }

  /** Runs the registration ceremony and returns the attestation to send back. */
  async register(options: unknown): Promise<unknown> {
    this.assertBrowser();
    const { startRegistration } = await import('@simplewebauthn/browser');
    return startRegistration({ optionsJSON: options as never });
  }

  /** Runs the authentication ceremony and returns the assertion to send back. */
  async authenticate(options: unknown): Promise<unknown> {
    this.assertBrowser();
    const { startAuthentication } = await import('@simplewebauthn/browser');
    return startAuthentication({ optionsJSON: options as never });
  }

  /**
   * Turns a ceremony rejection into something worth showing a user.
   *
   * The browser reports a cancelled prompt, a timeout, and an authenticator
   * the user is not allowed to use all as the same `NotAllowedError`, so the
   * wording has to cover the whole set rather than guess at one.
   *
   * Matched on `name` rather than `instanceof DOMException` because
   * `@simplewebauthn/browser` never rethrows the original DOMException: it
   * wraps it in a `WebAuthnError`, which extends `Error` and copies
   * `cause.name` across. Testing the constructor made every branch below
   * unreachable and leaked the raw vendor string to the user.
   */
  describeError(error: unknown): string {
    // Deliberately structural rather than `instanceof`: the two things that
    // actually reach here have incompatible prototypes. SimpleWebAuthn throws
    // its own `WebAuthnError` (an Error subclass that copies `cause.name`),
    // while the platform throws a `DOMException`, which does NOT extend Error
    // in every runtime. Gating on either constructor silently drops the other.
    const name = readProperty(error, 'name');
    if (name === 'NotAllowedError') {
      return 'The passkey prompt was dismissed or timed out. Try again.';
    }
    if (name === 'InvalidStateError') {
      return 'That authenticator is already registered on this account.';
    }
    if (name === 'NotSupportedError') {
      return 'This device cannot create a passkey of the required type.';
    }
    if (name === 'SecurityError') {
      return 'Passkeys require a secure connection to a matching domain.';
    }
    return readProperty(error, 'message') || 'The passkey step could not be completed.';
  }

  private assertBrowser(): void {
    if (!this.browser) {
      throw new Error('WebAuthn ceremonies require a browser');
    }
  }
}

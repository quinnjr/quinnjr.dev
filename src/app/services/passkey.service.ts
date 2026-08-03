import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/**
 * Thin wrapper over the WebAuthn browser ceremonies.
 *
 * `@simplewebauthn/browser` is loaded through a dynamic import so the library
 * stays out of the initial bundle and never executes during SSR — it touches
 * `navigator.credentials` at module scope, which does not exist on the server.
 */
@Injectable({ providedIn: 'root' })
export class PasskeyService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Whether this browser can perform a WebAuthn ceremony at all. Callers use
   * it to avoid offering an enrolment button that could only ever fail.
   */
  isSupported(): boolean {
    return this.browser && typeof PublicKeyCredential !== 'undefined';
  }

  /** Runs the registration ceremony and returns the attestation to send back. */
  async register(options: unknown): Promise<unknown> {
    const { startRegistration } = await import('@simplewebauthn/browser');
    return startRegistration({ optionsJSON: options as never });
  }

  /** Runs the authentication ceremony and returns the assertion to send back. */
  async authenticate(options: unknown): Promise<unknown> {
    const { startAuthentication } = await import('@simplewebauthn/browser');
    return startAuthentication({ optionsJSON: options as never });
  }

  /**
   * Turns a ceremony rejection into something worth showing a user.
   *
   * The browser reports a cancelled prompt, a timeout, and an authenticator
   * the user is not allowed to use all as the same `NotAllowedError`, so the
   * wording has to cover the whole set rather than guess at one.
   */
  describeError(error: unknown): string {
    if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'The passkey prompt was dismissed or timed out. Try again.';
      }
      if (error.name === 'InvalidStateError') {
        return 'That authenticator is already registered on this account.';
      }
      if (error.name === 'NotSupportedError') {
        return 'This device cannot create a passkey of the required type.';
      }
      if (error.name === 'SecurityError') {
        return 'Passkeys require a secure connection to a matching domain.';
      }
    }
    return error instanceof Error ? error.message : 'The passkey step could not be completed.';
  }
}

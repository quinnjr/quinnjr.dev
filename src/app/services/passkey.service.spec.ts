import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PasskeyService } from './passkey.service';

/**
 * `WebAuthnError` from `@simplewebauthn/browser` is an ordinary `Error`
 * subclass that copies `cause.name` onto itself — it is emphatically NOT a
 * `DOMException`. Reproducing that shape here is the whole point of these
 * cases: an `instanceof DOMException` check silently matched nothing.
 */
class FakeWebAuthnError extends Error {
  constructor(name: string, message = 'raw vendor text') {
    super(message);
    this.name = name;
  }
}

const globals = globalThis as unknown as Record<string, unknown>;

const makeService = (platform: 'browser' | 'server'): PasskeyService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [PasskeyService, { provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(PasskeyService);
};

describe('PasskeyService', () => {
  describe('isSupported', () => {
    // jsdom has no WebAuthn implementation, so the global is absent unless a
    // case installs it. Each case therefore states the world it needs.
    afterEach(() => {
      delete globals['PublicKeyCredential'];
    });

    it('is false on the server even when the global happens to exist', () => {
      globals['PublicKeyCredential'] = function PublicKeyCredential() {
        /* stub */
      };

      expect(makeService('server').isSupported()).toBe(false);
    });

    it('is false in a browser with no PublicKeyCredential', () => {
      delete globals['PublicKeyCredential'];

      expect(makeService('browser').isSupported()).toBe(false);
    });

    it('is false when PublicKeyCredential is present but not constructible', () => {
      globals['PublicKeyCredential'] = {};

      expect(makeService('browser').isSupported()).toBe(false);
    });

    it('is true in a browser with a constructible PublicKeyCredential', () => {
      globals['PublicKeyCredential'] = function PublicKeyCredential() {
        /* stub */
      };

      expect(makeService('browser').isSupported()).toBe(true);
    });
  });

  describe('ceremonies off-browser', () => {
    it('refuses to register rather than importing the library', async () => {
      await expect(makeService('server').register({})).rejects.toThrow(
        'WebAuthn ceremonies require a browser'
      );
    });

    it('refuses to authenticate rather than importing the library', async () => {
      await expect(makeService('server').authenticate({})).rejects.toThrow(
        'WebAuthn ceremonies require a browser'
      );
    });
  });

  describe('describeError', () => {
    let service: PasskeyService;

    beforeEach(() => {
      service = makeService('browser');
    });

    it('curates a WebAuthnError-shaped NotAllowedError', () => {
      expect(service.describeError(new FakeWebAuthnError('NotAllowedError'))).toBe(
        'The passkey prompt was dismissed or timed out. Try again.'
      );
    });

    it('curates a WebAuthnError-shaped InvalidStateError', () => {
      expect(service.describeError(new FakeWebAuthnError('InvalidStateError'))).toBe(
        'That authenticator is already registered on this account.'
      );
    });

    it('curates a WebAuthnError-shaped NotSupportedError', () => {
      expect(service.describeError(new FakeWebAuthnError('NotSupportedError'))).toBe(
        'This device cannot create a passkey of the required type.'
      );
    });

    it('curates a raw DOMException too', () => {
      expect(service.describeError(new DOMException('boom', 'SecurityError'))).toBe(
        'Passkeys require a secure connection to a matching domain.'
      );
    });

    it('falls back to the error message for an unrecognised name', () => {
      expect(service.describeError(new Error('something else'))).toBe('something else');
    });

    it('falls back to generic text for a non-Error rejection', () => {
      expect(service.describeError('nope')).toBe('The passkey step could not be completed.');
    });
  });
});

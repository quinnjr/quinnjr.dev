import { TestBed } from '@angular/core/testing';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';

import { AuthService, type LoginResult } from './auth.service';

/** Apollo delivers mutation results asynchronously under the testing
 *  controller, so assertions must wait a tick after `flush`. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

/** Minimal unsigned JWT — the client only ever reads the payload segment. */
const jwt = (claims: Record<string, unknown>): string => {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.signature`;
};

const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;

describe('AuthService', () => {
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ApolloTestingModule], providers: [AuthService] });
    controller = TestBed.inject(ApolloTestingController);
    localStorage.clear();
  });

  it('starts unauthenticated with no token', () => {
    const svc = TestBed.inject(AuthService);
    expect(svc.isAuthenticated()).toBe(false);
    expect(svc.token()).toBeNull();
  });

  it('clears token on logout', () => {
    const svc = TestBed.inject(AuthService);
    localStorage.setItem('auth_token', 'x.y.z');
    svc.logout();
    expect(svc.token()).toBeNull();
    expect(svc.isAuthenticated()).toBe(false);
  });

  describe('rehydration from a stored token', () => {
    it('populates currentUser at construction so a reload keeps the identity', () => {
      localStorage.setItem(
        'auth_token',
        jwt({ sub: 'u1', name: 'Joseph', role: 'ADMIN', exp: inOneHour() })
      );

      const svc = TestBed.inject(AuthService);

      expect(svc.isAuthenticated()).toBe(true);
      expect(svc.currentUser()).toEqual({ id: 'u1', name: 'Joseph', role: 'ADMIN' });
    });

    it('leaves currentUser null when the stored token has expired', () => {
      localStorage.setItem('auth_token', jwt({ sub: 'u1', name: 'Joseph', exp: 1 }));

      const svc = TestBed.inject(AuthService);

      expect(svc.isAuthenticated()).toBe(false);
      expect(svc.currentUser()).toBeNull();
    });

    it('clears currentUser when refreshAuthState finds the token gone', () => {
      localStorage.setItem('auth_token', jwt({ sub: 'u1', name: 'Joseph', exp: inOneHour() }));
      const svc = TestBed.inject(AuthService);
      localStorage.clear();

      expect(svc.refreshAuthState()).toBe(false);
      expect(svc.currentUser()).toBeNull();
    });
  });

  describe('login', () => {
    it('establishes a session when no passkey is enrolled', async () => {
      const svc = TestBed.inject(AuthService);
      let result: LoginResult | undefined;
      svc.login('a@b.com', 'pw').subscribe(r => (result = r));

      controller.expectOne('Login').flush({
        data: {
          login: {
            token: 'tok',
            mfaRequired: false,
            mfaToken: null,
            user: { id: 'u1', name: 'A', role: 'ADMIN' },
          },
        },
      });
      await settle();

      expect(result?.status).toBe('complete');
      expect(svc.token()).toBe('tok');
      expect(svc.isAuthenticated()).toBe(true);
    });

    it('does NOT establish a session when a passkey is required', async () => {
      const svc = TestBed.inject(AuthService);
      let result: LoginResult | undefined;
      svc.login('a@b.com', 'pw').subscribe(r => (result = r));

      controller.expectOne('Login').flush({
        data: { login: { token: null, mfaRequired: true, mfaToken: 'mfa-tok', user: null } },
      });
      await settle();

      expect(result).toEqual({ status: 'passkeyRequired', mfaToken: 'mfa-tok' });
      // The whole point of the second factor: a correct password leaves the
      // client with no stored credential and no authenticated state.
      expect(svc.token()).toBeNull();
      expect(svc.isAuthenticated()).toBe(false);
    });

    it('treats a passkey-required response with no mfaToken as a failure', async () => {
      const svc = TestBed.inject(AuthService);
      let errored = false;
      svc.login('a@b.com', 'pw').subscribe({ error: () => (errored = true) });

      controller.expectOne('Login').flush({
        data: { login: { token: null, mfaRequired: true, mfaToken: null, user: null } },
      });
      await settle();

      expect(errored).toBe(true);
      expect(svc.isAuthenticated()).toBe(false);
    });
  });

  describe('verifyPasskey', () => {
    it('establishes the session only after the assertion is verified', async () => {
      const svc = TestBed.inject(AuthService);
      let user: { id: string } | undefined;
      svc.verifyPasskey('mfa-tok', { id: 'cred' }).subscribe(u => (user = u));

      const op = controller.expectOne('VerifyPasskey');
      expect(op.operation.variables['mfaToken']).toBe('mfa-tok');
      op.flush({
        data: {
          verifyPasskey: { token: 'session-tok', user: { id: 'u1', name: 'A', role: 'ADMIN' } },
        },
      });
      await settle();

      expect(user?.id).toBe('u1');
      expect(svc.token()).toBe('session-tok');
      expect(svc.isAuthenticated()).toBe(true);
    });

    it('leaves the client unauthenticated when verification fails', async () => {
      const svc = TestBed.inject(AuthService);
      let errored = false;
      svc.verifyPasskey('mfa-tok', {}).subscribe({ error: () => (errored = true) });

      controller.expectOne('VerifyPasskey').networkError(new Error('nope'));
      await settle();

      expect(errored).toBe(true);
      expect(svc.token()).toBeNull();
      expect(svc.isAuthenticated()).toBe(false);
    });
  });

  describe('beginPasskeyAuthentication', () => {
    it('returns the assertion options for the pending attempt', async () => {
      const svc = TestBed.inject(AuthService);
      let options: unknown;
      svc.beginPasskeyAuthentication('mfa-tok').subscribe(o => (options = o));

      controller
        .expectOne('BeginPasskeyAuthentication')
        .flush({ data: { beginPasskeyAuthentication: { challenge: 'abc' } } });
      await settle();

      expect(options).toEqual({ challenge: 'abc' });
    });
  });
});

import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      mfaRequired
      mfaToken
      user {
        id
        name
        role
      }
    }
  }
`;

const VERIFY_PASSKEY = gql`
  mutation VerifyPasskey($mfaToken: String!, $response: JSON!) {
    verifyPasskey(mfaToken: $mfaToken, response: $response) {
      token
      user {
        id
        name
        role
      }
    }
  }
`;

const BEGIN_PASSKEY_AUTH = gql`
  mutation BeginPasskeyAuthentication($mfaToken: String!) {
    beginPasskeyAuthentication(mfaToken: $mfaToken)
  }
`;

const TOKEN_KEY = 'auth_token';
const LOGIN_FAILED = 'Login failed';

export interface LoginUser {
  id: string;
  name: string;
  role: string;
}

interface LoginPayload {
  token: string | null;
  user: LoginUser | null;
  mfaRequired: boolean;
  mfaToken: string | null;
}

interface LoginResponse {
  login: LoginPayload;
}

/**
 * Outcome of the password step. `complete` means the account has no passkey
 * enrolled and a session already exists; `passkeyRequired` means the password
 * was correct but is not sufficient on its own.
 */
export type LoginResult =
  | { status: 'complete'; user: LoginUser }
  | { status: 'passkeyRequired'; mfaToken: string };

interface JwtClaims {
  exp?: number;
  sub?: string;
  name?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apollo = inject(Apollo);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);

  readonly isAuthenticated = signal(this.hasValidToken());
  // Seeded from the token rather than left null: `establishSession` only runs
  // in the tab that performed the login, so after a reload the two signals
  // would otherwise disagree — the guard admits the user while every view
  // gated on `currentUser()` silently renders nothing.
  readonly currentUser = signal<LoginUser | null>(this.userFromStoredToken());

  token(): string | null {
    return this.browser ? localStorage.getItem(TOKEN_KEY) : null;
  }

  /**
   * First factor. Resolves to `passkeyRequired` when the account has an
   * authenticator enrolled — no session is established in that case, and the
   * caller must complete `verifyPasskey`.
   */
  login(email: string, password: string): Observable<LoginResult> {
    return this.apollo
      .mutate<LoginResponse>({
        mutation: LOGIN,
        variables: { email, password },
      })
      .pipe(
        map(res => {
          const payload = res.data?.login;
          if (!payload) {
            throw new Error(LOGIN_FAILED);
          }
          if (payload.mfaRequired) {
            if (!payload.mfaToken) {
              throw new Error(LOGIN_FAILED);
            }
            return { status: 'passkeyRequired', mfaToken: payload.mfaToken } as const;
          }
          if (!payload.token || !payload.user) {
            throw new Error(LOGIN_FAILED);
          }
          this.establishSession(payload.token, payload.user);
          return { status: 'complete', user: payload.user } as const;
        })
      );
  }

  /** Fetches the assertion options for the pending sign-in attempt. */
  beginPasskeyAuthentication(mfaToken: string): Observable<unknown> {
    return this.apollo
      .mutate<{ beginPasskeyAuthentication: unknown }>({
        mutation: BEGIN_PASSKEY_AUTH,
        variables: { mfaToken },
      })
      .pipe(
        map(res => {
          const options = res.data?.beginPasskeyAuthentication;
          if (!options) {
            throw new Error('Could not start the passkey step');
          }
          return options;
        })
      );
  }

  /** Second factor. Only this establishes a session when a passkey is enrolled. */
  verifyPasskey(mfaToken: string, response: unknown): Observable<LoginUser> {
    return this.apollo
      .mutate<{ verifyPasskey: { token: string; user: LoginUser } }>({
        mutation: VERIFY_PASSKEY,
        variables: { mfaToken, response },
      })
      .pipe(
        map(res => {
          const payload = res.data?.verifyPasskey;
          if (!payload?.token) {
            throw new Error('Passkey verification failed');
          }
          this.establishSession(payload.token, payload.user);
          return payload.user;
        })
      );
  }

  private establishSession(token: string, user: LoginUser): void {
    if (this.browser) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    if (this.browser) {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    // Reset the Apollo store after logout; errors are intentionally swallowed
    // since a failed reset should not block the logout flow.
    this.apollo.client.resetStore().catch(() => undefined);
  }

  /**
   * Re-derives authentication from the stored token and syncs both signals so
   * the UI reflects an expiry that happened after login. Prefer this over
   * reading the signal when the answer must be current.
   */
  refreshAuthState(): boolean {
    const valid = this.hasValidToken();
    if (this.isAuthenticated() !== valid) {
      this.isAuthenticated.set(valid);
    }
    if (!valid) {
      if (this.currentUser() !== null) {
        this.currentUser.set(null);
      }
    } else if (!this.currentUser()) {
      // Only fill a gap — a user established by `login`/`verifyPasskey` comes
      // from the server and is at least as complete as the token claims.
      this.currentUser.set(this.userFromStoredToken());
    }
    return valid;
  }

  /** True when a stored token exists and its `exp` is in the future. */
  hasValidToken(): boolean {
    return this.unexpiredClaims() !== null;
  }

  /**
   * The identity carried by the stored token, or null when there is no live
   * token. `sub` is the only claim a session cannot exist without, so a token
   * missing it is treated as carrying no identity at all.
   */
  private userFromStoredToken(): LoginUser | null {
    const claims = this.unexpiredClaims();
    if (!claims?.sub) {
      return null;
    }
    return { id: claims.sub, name: claims.name ?? '', role: claims.role ?? '' };
  }

  /** Decoded claims of the stored token, or null if absent, malformed or expired. */
  private unexpiredClaims(): JwtClaims | null {
    const token = this.token();
    if (!token) {
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length < 2 || !parts[1]) {
        return null;
      }
      // base64url → base64, then re-pad: `atob` rejects an unpadded input,
      // and JWT segments are emitted without padding.
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      // JSON.parse returns `any`; casting through `unknown` gives us a typed
      // shape without triggering unsafe-assignment from the `any` origin.
      const raw: unknown = JSON.parse(atob(padded)) as unknown;
      const claims = raw as JwtClaims;
      if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) {
        return null;
      }
      return claims;
    } catch {
      return null;
    }
  }
}

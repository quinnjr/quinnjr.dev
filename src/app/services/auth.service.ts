import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import type { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        role
      }
    }
  }
`;

const TOKEN_KEY = 'auth_token';

export interface LoginUser {
  id: string;
  name: string;
  role: string;
}

interface LoginPayload {
  token: string;
  user: LoginUser;
}

interface LoginResponse {
  login: LoginPayload;
}

interface JwtClaims {
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apollo = inject(Apollo);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);

  readonly isAuthenticated = signal(this.hasValidToken());
  readonly currentUser = signal<LoginUser | null>(null);

  token(): string | null {
    return this.browser ? localStorage.getItem(TOKEN_KEY) : null;
  }

  login(email: string, password: string): Observable<LoginUser> {
    return this.apollo
      .mutate<LoginResponse>({
        mutation: LOGIN,
        variables: { email, password },
      })
      .pipe(
        map(res => {
          const payload = res.data?.login;
          if (!payload) {
            throw new Error('Login failed');
          }
          return payload;
        }),
        tap(payload => {
          if (this.browser) {
            localStorage.setItem(TOKEN_KEY, payload.token);
          }
          this.currentUser.set(payload.user);
          this.isAuthenticated.set(true);
        }),
        map(payload => payload.user)
      );
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
   * Re-derives authentication from the stored token and syncs the
   * `isAuthenticated` signal so the UI reflects an expiry that happened after
   * login. Prefer this over reading the signal when the answer must be current.
   */
  refreshAuthState(): boolean {
    const valid = this.hasValidToken();
    if (this.isAuthenticated() !== valid) {
      this.isAuthenticated.set(valid);
    }
    return valid;
  }

  /** True when a stored token exists and its `exp` is in the future. */
  hasValidToken(): boolean {
    const token = this.token();
    if (!token) {
      return false;
    }
    try {
      const parts = token.split('.');
      if (parts.length < 2 || !parts[1]) {
        return false;
      }
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // JSON.parse returns `any`; casting through `unknown` gives us a typed
      // shape without triggering unsafe-assignment from the `any` origin.
      const raw: unknown = JSON.parse(atob(base64)) as unknown;
      const claims = raw as JwtClaims;
      return typeof claims.exp === 'number' && claims.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}

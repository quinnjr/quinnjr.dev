import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { ApolloTestingModule } from 'apollo-angular/testing';

import { AuthService } from '../services/auth.service';

import { authGuard } from './auth.guard';

/** Minimal unsigned JWT whose `exp` is `secondsFromNow` away. */
const tokenExpiringIn = (secondsFromNow: number): string => {
  const claims = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }));
  return `header.${claims}.signature`;
};

describe('authGuard', () => {
  const run = (url: string) =>
    TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never)) as
      | boolean
      | UrlTree;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [provideRouter([])],
    });
    localStorage.clear();
  });

  it('activates when the stored token is still valid', () => {
    localStorage.setItem('auth_token', tokenExpiringIn(3600));

    expect(run('/admin')).toBe(true);
  });

  it('redirects to /login with a returnUrl when the token has expired', () => {
    localStorage.setItem('auth_token', tokenExpiringIn(-60));

    const result = run('/admin/posts');

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fadmin%2Fposts'
    );
  });

  it('does not activate on a token that expired after login', () => {
    // The signal is seeded true at login; the guard must not trust that cache.
    localStorage.setItem('auth_token', tokenExpiringIn(3600));
    const auth = TestBed.inject(AuthService);
    expect(run('/admin')).toBe(true);

    localStorage.setItem('auth_token', tokenExpiringIn(-1));

    expect(run('/admin')).toBeInstanceOf(UrlTree);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('does not activate when no token is stored', () => {
    const result = run('/admin');

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fadmin'
    );
  });
});

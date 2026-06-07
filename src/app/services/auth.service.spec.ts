import { TestBed } from '@angular/core/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ApolloTestingModule], providers: [AuthService] });
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
});

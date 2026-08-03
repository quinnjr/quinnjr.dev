import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';

import { authInterceptor } from './auth.interceptor';

const TOKEN = 'header.payload.signature';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  /** Fires a GET through the interceptor chain and returns the outgoing request. */
  const send = (url: string) => {
    http.get(url).subscribe({ next: () => undefined, error: () => undefined });
    return controller.expectOne(url);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    localStorage.clear();
    localStorage.setItem('auth_token', TOKEN);
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('attaches the bearer token to a same-origin /graphql request', () => {
    expect(send('/graphql').request.headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
  });

  it('does not leak the token to a cross-origin url that merely contains /graphql', () => {
    expect(send('https://evil.test/track?u=/graphql').request.headers.has('Authorization')).toBe(
      false
    );
  });

  it('does not attach the token to a non-graphql same-origin request', () => {
    expect(send('/api/github/repositories').request.headers.has('Authorization')).toBe(false);
  });

  it('does not attach the token when a same-origin path only starts with /graphql', () => {
    expect(send('/graphql-playground').request.headers.has('Authorization')).toBe(false);
  });

  it('sends no header when there is no stored token', () => {
    localStorage.clear();

    expect(send('/graphql').request.headers.has('Authorization')).toBe(false);
  });
});

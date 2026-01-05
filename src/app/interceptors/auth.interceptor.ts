import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap, take } from 'rxjs/operators';

/**
 * HTTP Interceptor to add Auth0 access token to API requests
 * Automatically attaches the Bearer token to requests to /api/*
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Only add token to API requests
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  // Skip token for public endpoints
  if (req.url.includes('/api/resume/public')) {
    return next(req);
  }

  // Get the access token and add it to the request
  return authService.getAccessTokenSilently().pipe(
    take(1),
    switchMap(token => {
      // Clone the request and add the authorization header
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(authReq);
    })
  );
};

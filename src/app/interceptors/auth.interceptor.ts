import { type HttpInterceptorFn } from '@angular/common/http';
import { DOCUMENT, inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

/** Pathname of the GraphQL endpoint the session token is scoped to. */
const GRAPHQL_PATH = '/graphql';

/**
 * True only when `url` resolves — against the document base — to this origin
 * and to exactly the GraphQL pathname. A substring test would hand the bearer
 * token to any third-party URL that merely mentions `/graphql`, e.g. in a
 * query string.
 */
function isGraphqlEndpoint(url: string, baseURI: string): boolean {
  try {
    const base = new URL(baseURI);
    const target = new URL(url, base);
    return target.origin === base.origin && target.pathname === GRAPHQL_PATH;
  } catch {
    return false;
  }
}

/** Attaches the session bearer token to same-origin GraphQL requests. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  // Registered in the browser config only, so the document base is the right
  // basis for resolving relative request URLs.
  const { baseURI } = inject(DOCUMENT);

  if (token && isGraphqlEndpoint(req.url, baseURI)) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};

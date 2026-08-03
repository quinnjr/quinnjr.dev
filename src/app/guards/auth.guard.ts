import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guards admin routes. The token is re-validated on every activation because
 * `isAuthenticated` is only written on login/logout — a token that expires
 * mid-session would otherwise keep admin routes open for the rest of the tab's
 * lifetime.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.refreshAuthState()) {
    return true;
  }

  // A UrlTree redirects as part of this navigation; an imperative
  // router.navigate() would race the abort of the navigation being blocked.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

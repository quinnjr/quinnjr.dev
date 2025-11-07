import { inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { map } from 'rxjs/operators';

export const authGuard = () => {
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (!isAuthenticated) {
        authService.loginWithRedirect({
          appState: { target: window.location.pathname },
        });
        return false;
      }
      return true;
    })
  );
};

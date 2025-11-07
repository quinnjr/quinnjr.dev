import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map } from 'rxjs/operators';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        authService.loginWithRedirect({
          appState: { target: window.location.pathname }
        });
        return false;
      }
      return true;
    })
  );
};


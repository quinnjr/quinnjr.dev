import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/components/ui';

@Component({
  selector: 'app-auth-button',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2">
      @if (auth.isAuthenticated()) {
        <app-button (click)="logout()" variant="ember" size="sm">
          <i class="fas fa-sign-out-alt"></i>
          <span class="ml-2 hidden md:inline">Logout</span>
        </app-button>
      } @else {
        <app-button (click)="goToLogin()" variant="amber" size="sm">
          <i class="fas fa-sign-in-alt"></i>
          <span class="ml-2 hidden md:inline">Login</span>
        </app-button>
      }
    </div>
  `,
  styles: [],
})
export class AuthButtonComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // `isAuthenticated` is only written on login/logout, so a token that
    // expired mid-session leaves this button offering "Logout" while the guard
    // is already bouncing the user to /login. Re-deriving on init also settles
    // the SSR-false / client-true swap on hydration.
    this.auth.refreshAuthState();
  }

  goToLogin(): void {
    this.router.navigate(['/login']).catch(() => undefined);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']).catch(() => undefined);
  }
}

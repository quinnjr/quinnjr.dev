import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
export class AuthButtonComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  goToLogin(): void {
    this.router.navigate(['/login']).catch(() => undefined);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']).catch(() => undefined);
  }
}

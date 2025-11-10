import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Injector, PLATFORM_ID } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-auth-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2">
      @if (isBrowser && auth && (auth.isAuthenticated$ | async)) {
        <!-- User is logged in -->
        <div class="flex items-center gap-3">
          @if (auth.user$ | async; as user) {
            <div class="flex items-center gap-2">
              @if (user.picture) {
                <img
                  [src]="user.picture"
                  [alt]="user.name"
                  class="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                />
              }
              <span class="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:inline">
                {{ user.name || user.email }}
              </span>
            </div>
          }
          <button
            (click)="logout()"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            <i class="fas fa-sign-out-alt"></i>
            <span class="ml-2 hidden md:inline">Logout</span>
          </button>
        </div>
      } @else {
        <!-- User is not logged in or SSR -->
        <button
          (click)="login()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          [disabled]="!isBrowser"
        >
          <i class="fas fa-sign-in-alt"></i>
          <span class="ml-2 hidden md:inline">Login</span>
        </button>
      }
    </div>
  `,
  styles: [],
})
export class AuthButtonComponent {
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  public isBrowser = isPlatformBrowser(this.platformId);
  // Inject AuthService optionally - it won't be available during SSR
  public auth: AuthService | null = null;

  constructor() {
    if (this.isBrowser) {
      // Only inject Auth0 in browser context using Injector
      try {
        this.auth = this.injector.get(AuthService, null);
      } catch {
        // Auth0 not available (SSR context)
        this.auth = null;
      }
    }
  }

  login(): void {
    if (this.auth && this.isBrowser) {
      this.auth.loginWithRedirect();
    }
  }

  logout(): void {
    if (this.auth && this.isBrowser) {
      this.auth.logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    }
  }
}

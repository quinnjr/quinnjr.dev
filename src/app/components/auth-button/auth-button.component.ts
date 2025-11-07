import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-auth-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2">
      @if (auth.isAuthenticated$ | async) {
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
        <!-- User is not logged in -->
        <button
          (click)="login()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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
  public auth = inject(AuthService);

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }
}

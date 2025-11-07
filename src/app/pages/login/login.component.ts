import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Secure authentication powered by Auth0
          </p>
        </div>

        @if (auth.isLoading$ | async) {
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        } @else if (auth.isAuthenticated$ | async) {
          <div class="rounded-md bg-green-50 dark:bg-green-900 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-check-circle text-green-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
                  Already authenticated
                </h3>
                <div class="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>You are already logged in. Redirecting to admin panel...</p>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="mt-8 space-y-6">
            <div class="rounded-md shadow-sm -space-y-px">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div class="space-y-4">
                  <button
                    type="button"
                    (click)="loginWithRedirect()"
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                      <i class="fas fa-lock text-blue-500 group-hover:text-blue-400"></i>
                    </span>
                    Sign in with Auth0
                  </button>

                  <div class="text-center">
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      By signing in, you agree to our terms of service and privacy policy.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="text-center">
              <a routerLink="/" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                <i class="fas fa-arrow-left mr-2"></i>
                Back to home
              </a>
            </div>
          </div>
        }

        <!-- Features -->
        <div class="mt-8">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <i class="fas fa-shield-alt text-blue-600 dark:text-blue-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">Secure</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">Enterprise-grade security</p>
              </div>
            </div>
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <i class="fas fa-fingerprint text-blue-600 dark:text-blue-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">Multi-Factor</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">Optional MFA support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnInit {
  public auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // If already authenticated, redirect to admin
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 1500);
      }
    });
  }

  loginWithRedirect(): void {
    this.auth.loginWithRedirect({
      appState: { target: '/admin' }
    });
  }
}


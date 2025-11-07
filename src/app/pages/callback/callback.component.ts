import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-callback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <h2 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Completing authentication...
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Please wait while we redirect you.
        </p>
      </div>
    </div>
  `,
  styles: [],
})
export class CallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Auth0 will handle the callback automatically
    // Then redirect to the intended destination
    this.auth.appState$.subscribe(appState => {
      const target = (appState as { target?: string } | null)?.target ?? '/admin';
      this.router.navigate([target]).catch(() => {
        // Navigation error handled
      });
    });
  }
}

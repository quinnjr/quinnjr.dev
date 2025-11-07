import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthButtonComponent } from '../../../components/auth-button/auth-button.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AuthButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <!-- Admin Header -->
      <header class="bg-white dark:bg-gray-800 shadow-md">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <a routerLink="/admin" class="text-2xl font-bold text-gray-900 dark:text-white">
                <i class="fas fa-shield-alt mr-2"></i>Admin Panel
              </a>
              <nav class="hidden md:flex gap-4 ml-8">
                <a
                  routerLink="/admin"
                  routerLinkActive="text-blue-600 dark:text-blue-400"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <i class="fas fa-home mr-1"></i>Dashboard
                </a>
                <a
                  routerLink="/admin/articles"
                  routerLinkActive="text-blue-600 dark:text-blue-400"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <i class="fas fa-newspaper mr-1"></i>Articles
                </a>
                <a
                  routerLink="/admin/projects"
                  routerLinkActive="text-blue-600 dark:text-blue-400"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <i class="fas fa-project-diagram mr-1"></i>Projects
                </a>
                <a
                  routerLink="/admin/settings"
                  routerLinkActive="text-blue-600 dark:text-blue-400"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <i class="fas fa-cog mr-1"></i>Settings
                </a>
              </nav>
            </div>
            <div class="flex items-center gap-4">
              <a
                routerLink="/"
                class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <i class="fas fa-globe mr-1"></i>View Site
              </a>
              <app-auth-button></app-auth-button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [],
})
export class AdminLayoutComponent {}

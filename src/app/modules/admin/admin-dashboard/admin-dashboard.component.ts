import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

import {
  ButtonComponent,
  CardComponent,
  CardBodyComponent,
  BadgeComponent,
} from '../../../shared/components/ui';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    CardBodyComponent,
    BadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            <i class="fas fa-tachometer-alt mr-3"></i>Admin Dashboard
          </h1>
          <p class="text-gray-600 dark:text-gray-400">Welcome to the administration panel</p>
        </div>

        <!-- User Info Card -->
        @if (auth.user$ | async; as user) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              <i class="fas fa-user-circle mr-2"></i>User Information
            </h2>
            <div class="flex items-center gap-4">
              @if (user.picture) {
                <img
                  [src]="user.picture"
                  [alt]="user.name"
                  class="w-20 h-20 rounded-full border-4 border-blue-500"
                />
              }
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ user.name }}</h3>
                <p class="text-gray-600 dark:text-gray-400">{{ user.email }}</p>
                @if (user.email_verified) {
                  <div class="mt-2">
                    <app-badge variant="success" badgeStyle="soft">
                      <i class="fas fa-check-circle mr-1"></i>Verified
                    </app-badge>
                  </div>
                }
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                <p class="text-sm font-mono text-gray-900 dark:text-white break-all">
                  {{ user.sub }}
                </p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                <p class="text-sm font-mono text-gray-900 dark:text-white">
                  {{ user.updated_at | date: 'medium' }}
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">1</p>
              </div>
              <div
                class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center"
              >
                <i class="fas fa-users text-blue-600 dark:text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">1</p>
              </div>
              <div
                class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"
              >
                <i class="fas fa-chart-line text-green-600 dark:text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Articles</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <div
                class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center"
              >
                <i class="fas fa-newspaper text-yellow-600 dark:text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Projects</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <div
                class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center"
              >
                <i class="fas fa-project-diagram text-purple-600 dark:text-purple-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            <i class="fas fa-bolt mr-2"></i>Quick Actions
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a routerLink="/admin/articles/new">
              <app-button variant="primary" [fullWidth]="true">
                <i class="fas fa-plus mr-2"></i>New Article
              </app-button>
            </a>
            <a routerLink="/admin/resume">
              <app-button variant="success" [fullWidth]="true">
                <i class="fas fa-file-alt mr-2"></i>Edit Resume
              </app-button>
            </a>
            <app-button variant="secondary" [fullWidth]="true">
              <i class="fas fa-cog mr-2"></i>Settings
            </app-button>
            <app-button variant="ghost" [fullWidth]="true">
              <i class="fas fa-chart-bar mr-2"></i>Analytics
            </app-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminDashboardComponent {
  public auth = inject(AuthService);
}

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

import { AuthService } from '../../../services/auth.service';
import { ButtonComponent, BadgeComponent } from '../../../shared/components/ui';

// `posts` is the only admin-scoped query the schema offers; its length is the
// real article count for the signed-in author (editors and above see all).
const ADMIN_POST_COUNT = gql`
  query AdminPostCount {
    posts {
      id
    }
  }
`;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, BadgeComponent],
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
        @if (auth.currentUser(); as user) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              <i class="fas fa-user-circle mr-2"></i>User Information
            </h2>
            <div class="flex items-center gap-4">
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ user.name }}</h3>
                <div class="mt-2">
                  <app-badge variant="success" badgeStyle="soft">
                    <i class="fas fa-check-circle mr-1"></i>{{ user.role }}
                  </app-badge>
                </div>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                <p class="text-sm font-mono text-gray-900 dark:text-white break-all">
                  {{ user.id }}
                </p>
              </div>
            </div>
          </div>
        }

        <!--
          Stats Grid — only metrics the server can actually answer.
          "Active Sessions" has no backing query and "Projects" comes from the
          GitHub API rather than the database, so those tiles were removed
          instead of shipping placeholder numbers as facts. "Total Users" has no
          users query either.
        -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Articles</p>
                @if (articleCountError()) {
                  <p
                    class="text-sm text-red-600 dark:text-red-400 mt-1"
                    role="alert"
                    data-testid="article-count-error"
                  >
                    Unavailable
                  </p>
                } @else if (articleCount() === null) {
                  <p class="text-3xl font-bold text-gray-400 dark:text-gray-500">—</p>
                } @else {
                  <p
                    class="text-3xl font-bold text-gray-900 dark:text-white"
                    data-testid="article-count"
                  >
                    {{ articleCount() }}
                  </p>
                }
              </div>
              <div
                class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center"
              >
                <i class="fas fa-newspaper text-yellow-600 dark:text-yellow-400 text-xl"></i>
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
            <!-- New Project / Settings / Analytics used to live here as enabled
                 buttons with no handler and no destination. -->
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminDashboardComponent implements OnInit {
  public auth = inject(AuthService);
  private readonly apollo = inject(Apollo);
  private readonly destroyRef = inject(DestroyRef);

  /** null until the count is known — the tile renders a dash rather than a 0. */
  readonly articleCount = signal<number | null>(null);
  readonly articleCountError = signal(false);

  ngOnInit(): void {
    this.apollo
      .watchQuery<{ posts: Array<{ id: string }> }>({ query: ADMIN_POST_COUNT })
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Apollo Client 4 reports watchQuery failures on the result itself
        // rather than erroring the stream; the `error` callback stays as a
        // backstop for anything that does terminate the observable.
        next: ({ data, error }) => {
          if (error) {
            this.setCountError(error);
            return;
          }
          this.articleCountError.set(false);
          this.articleCount.set(data?.posts?.length ?? 0);
        },
        error: (err: unknown) => this.setCountError(err),
      });
  }

  private setCountError(err: unknown): void {
    this.articleCountError.set(true);
    console.error('Failed to load admin post count', err);
  }
}

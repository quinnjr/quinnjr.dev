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

import { ButtonComponent } from '../../../shared/components/ui';

const ADMIN_POSTS = gql`
  query AdminPosts($status: PostStatus) {
    posts(status: $status) {
      id
      title
      status
      updatedAt
    }
  }
`;

interface AdminPost {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              <i class="fas fa-newspaper mr-2"></i>Blog Articles
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your blog posts</p>
          </div>
          <a routerLink="/admin/articles/new">
            <app-button variant="primary"> <i class="fas fa-plus mr-2"></i>New Article </app-button>
          </a>
        </div>

        @if (loadError()) {
          <!-- Distinct from the empty state: an outage or auth failure must not
               be reported to an author as "you have no articles". -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center"
            role="alert"
            data-testid="posts-load-error"
          >
            <i class="fas fa-triangle-exclamation text-red-500 text-6xl mb-4"></i>
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Could not load your articles
            </h2>
            <p class="text-gray-600 dark:text-gray-400">{{ loadError() }}</p>
          </div>
        } @else if (posts().length) {
          <ul class="space-y-2">
            @for (post of posts(); track post.id) {
              <li
                class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div>
                  <a
                    [routerLink]="['/admin/articles/edit', post.id]"
                    class="font-semibold text-gray-900 dark:text-white"
                    >{{ post.title }}</a
                  >
                  <span class="ml-2 text-sm text-gray-500">{{ post.status }}</span>
                </div>
              </li>
            }
          </ul>
        } @else {
          <!-- Empty State -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <i class="fas fa-newspaper text-gray-400 text-6xl mb-4"></i>
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No articles yet
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first blog post
            </p>
            <a routerLink="/admin/articles/new">
              <app-button variant="primary" size="lg">
                <i class="fas fa-plus mr-2"></i>Create Your First Article
              </app-button>
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class BlogListComponent implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly destroyRef = inject(DestroyRef);
  readonly posts = signal<AdminPost[]>([]);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.apollo
      .watchQuery<{ posts: AdminPost[] }>({ query: ADMIN_POSTS })
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Apollo Client 4 reports watchQuery failures on the result itself
        // rather than erroring the stream; the `error` callback stays as a
        // backstop for anything that does terminate the observable.
        next: ({ data, error }) => {
          if (error) {
            this.setLoadError(error);
            return;
          }
          this.loadError.set(null);
          this.posts.set((data?.posts ?? []) as AdminPost[]);
        },
        error: (err: unknown) => this.setLoadError(err),
      });
  }

  private setLoadError(err: unknown): void {
    this.loadError.set(
      err instanceof Error && err.message ? err.message : 'The server did not return your articles.'
    );
    console.error('Failed to load admin posts', err);
  }
}

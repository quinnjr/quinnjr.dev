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

import { BadgeComponent, type BadgeVariant } from '../../../shared/components/ui';

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
  imports: [CommonModule, RouterLink, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-10 md:py-14">
      <!-- Header -->
      <header class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="tavern-eyebrow">Admin console</p>
          <h1 class="mt-2 font-medieval text-3xl text-parchment md:text-4xl">Articles</h1>
          <p class="mt-2 font-body text-muted">Drafts and published posts, newest edits first.</p>
        </div>
        <a routerLink="/admin/articles/new" class="btn-rpg btn-rpg-primary self-start md:self-auto">
          <i class="fas fa-feather-pointed" aria-hidden="true"></i>New article
        </a>
      </header>

      @if (loadError()) {
        <!-- Distinct from the empty state: an outage or auth failure must not
             be reported to an author as "you have no articles". -->
        <div class="admin-panel" role="alert" data-testid="posts-load-error">
          <h2 class="admin-panel-title">
            <i class="fas fa-triangle-exclamation text-blood" aria-hidden="true"></i>
            Could not load your articles
          </h2>
          <p class="notice-error">{{ loadError() }}</p>
          <p class="mt-4 font-body text-sm text-muted">
            Reload the page to retry. If it keeps failing, your session may have expired.
          </p>
        </div>
      } @else if (loading()) {
        <!-- Also distinct from the empty state: until the server answers, we
             do not know whether this author has articles. -->
        <div class="admin-panel" data-testid="posts-loading" aria-busy="true">
          <span class="sr-only" role="status">Loading your articles…</span>
          <ul class="divide-y divide-amber/10" aria-hidden="true">
            @for (row of skeletonRows; track row) {
              <li class="flex items-center justify-between gap-4 py-4">
                <span class="skeleton block h-4" [style.width.%]="row"></span>
                <span class="skeleton block h-5 w-20"></span>
              </li>
            }
          </ul>
        </div>
      } @else if (posts().length) {
        <ul class="admin-panel divide-y divide-amber/10 py-2">
          @for (post of posts(); track post.id) {
            <li class="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <a
                [routerLink]="['/admin/articles/edit', post.id]"
                class="link-tavern self-start font-heading text-parchment"
                >{{ post.title }}</a
              >
              <div class="flex items-center gap-3">
                <time [attr.datetime]="post.updatedAt" class="font-mono text-xs text-muted">
                  {{ post.updatedAt | date: 'MMM d, y' }}
                </time>
                <app-badge [variant]="statusVariant(post.status)" badgeStyle="soft">
                  {{ post.status | titlecase }}
                </app-badge>
              </div>
            </li>
          }
        </ul>
      } @else {
        <!-- Empty State -->
        <div
          class="admin-panel flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8"
        >
          <i class="fas fa-feather-pointed text-5xl text-amber/60" aria-hidden="true"></i>
          <div class="flex-1">
            <h2 class="font-heading text-xl text-parchment">No articles yet</h2>
            <p class="mt-1 max-w-[65ch] font-body text-muted">
              New articles start as drafts and stay private until you publish them.
            </p>
          </div>
          <a routerLink="/admin/articles/new" class="btn-rpg btn-rpg-primary">
            <i class="fas fa-plus" aria-hidden="true"></i>Write your first article
          </a>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class BlogListComponent implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly destroyRef = inject(DestroyRef);
  readonly posts = signal<AdminPost[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  /** Title widths (%) for the loading skeleton, uneven so it reads as a list. */
  readonly skeletonRows = [62, 44, 71, 38];

  statusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'SCHEDULED':
        return 'info';
      case 'DRAFT':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  ngOnInit(): void {
    this.apollo
      .watchQuery<{ posts: AdminPost[] }>({ query: ADMIN_POSTS })
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Apollo Client 4 emits the in-flight result first (`data: undefined`,
        // `loading: true`) and reports failures on the result itself rather
        // than erroring the stream; the `error` callback stays as a backstop
        // for anything that does terminate the observable.
        next: ({ data, error, loading }) => {
          // Falling through here would re-set `posts` to [] and show the
          // "No articles yet" panel before the server has answered.
          if (loading) {
            return;
          }
          this.loading.set(false);
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
    this.loading.set(false);
    this.loadError.set(
      err instanceof Error && err.message ? err.message : 'The server did not return your articles.'
    );
    console.error('Failed to load admin posts', err);
  }
}

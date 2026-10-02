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
import { BadgeComponent } from '../../../shared/components/ui';

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
  imports: [CommonModule, RouterLink, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-10 md:py-14">
      <!-- Header -->
      <header class="mb-10">
        <p class="tavern-eyebrow">Admin console</p>
        <h1 class="mt-2 font-medieval text-3xl text-parchment md:text-4xl">Dashboard</h1>
        <p class="mt-2 max-w-[65ch] font-body text-muted">
          Drafts, published articles and sign-in keys for quinnjr.dev.
        </p>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <!-- Account -->
        @if (auth.currentUser(); as user) {
          <section class="admin-panel" aria-labelledby="account-heading">
            <h2 id="account-heading" class="admin-panel-title">
              <i class="fas fa-user-circle" aria-hidden="true"></i>Account
            </h2>
            <div class="flex flex-wrap items-center gap-3">
              <p class="font-heading text-xl text-parchment">{{ user.name }}</p>
              <app-badge variant="success" badgeStyle="soft">
                <i class="fas fa-check-circle mr-1" aria-hidden="true"></i>{{ user.role }}
              </app-badge>
            </div>
            <dl class="mt-6 border-t border-amber/15 pt-4">
              <dt class="field-label">User ID</dt>
              <dd class="break-all font-mono text-sm text-parchment">{{ user.id }}</dd>
            </dl>
          </section>
        }

        <!--
          Only metrics the server can actually answer.
          "Active Sessions" has no backing query and "Projects" comes from the
          GitHub API rather than the database, so those tiles were removed
          instead of shipping placeholder numbers as facts. "Total Users" has no
          users query either.
        -->
        <section class="admin-panel flex flex-col" aria-labelledby="articles-heading">
          <h2 id="articles-heading" class="admin-panel-title">
            <i class="fas fa-scroll" aria-hidden="true"></i>Articles
          </h2>
          @if (articleCountError()) {
            <p class="notice-error" role="alert" data-testid="article-count-error">
              <i class="fas fa-triangle-exclamation mt-0.5" aria-hidden="true"></i>
              Unavailable — the post count query failed. Reload to retry.
            </p>
          } @else if (articleCount() === null) {
            <p class="font-mono text-4xl text-muted" aria-label="Loading article count">—</p>
          } @else {
            <p class="font-mono text-4xl text-amber-bright" data-testid="article-count">
              {{ articleCount() }}
            </p>
          }
          <div class="mt-6 flex flex-wrap gap-3 border-t border-amber/15 pt-5">
            <!-- New Project / Settings / Analytics used to live here as enabled
                 buttons with no handler and no destination. -->
            <a routerLink="/admin/articles/new" class="btn-rpg btn-rpg-primary">
              <i class="fas fa-feather-pointed" aria-hidden="true"></i>New article
            </a>
            <a routerLink="/admin/articles" class="btn-rpg">
              <i class="fas fa-list" aria-hidden="true"></i>All articles
            </a>
          </div>
        </section>
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
        // Apollo Client 4 emits the in-flight result first (`data: undefined`,
        // `loading: true`) and reports failures on the result itself rather
        // than erroring the stream; the `error` callback stays as a backstop
        // for anything that does terminate the observable.
        next: ({ data, error, loading }) => {
          // Without this guard the in-flight emission would fall through to
          // `?? 0` and render a fabricated count for the whole request.
          if (loading) {
            return;
          }
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

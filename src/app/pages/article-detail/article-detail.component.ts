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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

const POST_BY_SLUG = gql`
  query Post($slug: String!) {
    post(slug: $slug) {
      id
      title
      content
      publishedAt
      author {
        id
        name
      }
    }
  }
`;

const RECORD_POST_VIEW = gql`
  mutation RecordPostView($slug: String!) {
    recordPostView(slug: $slug)
  }
`;

interface ArticlePost {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
  author: { id: string; name: string } | null;
}

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tavern-shell">
      <div class="container mx-auto max-w-3xl px-4 py-16">
        <a routerLink="/articles" class="link-tavern font-mono text-sm">
          <i class="fas fa-arrow-left mr-2" aria-hidden="true"></i>All chronicles
        </a>
        @if (post(); as p) {
          <article class="mt-8">
            <p class="tavern-eyebrow">Chronicle</p>
            <h1 class="mt-3 mb-3 font-medieval text-4xl leading-tight text-parchment">
              {{ p.title }}
            </h1>
            @if (p.author) {
              <p class="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
                Inked by {{ p.author.name }}
              </p>
            }
            <div class="section-divider-rpg revealed"></div>
            <div class="scroll-prose mt-6" [innerHTML]="p.content"></div>
          </article>
        } @else if (loaded()) {
          <div class="card-stone mt-10 p-8 text-center">
            <i class="fas fa-feather mb-3 text-3xl text-amber" aria-hidden="true"></i>
            <p class="font-body text-muted">This entry could not be found in the archive.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class ArticleDetailComponent implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly post = signal<ArticlePost | null>(null);
  readonly loaded = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.loaded.set(true);
      return;
    }

    this.apollo
      .watchQuery<{ post: ArticlePost | null }>({ query: POST_BY_SLUG, variables: { slug } })
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ data }) => {
        this.post.set((data?.post ?? null) as ArticlePost | null);
        this.loaded.set(true);
      });

    // Count the view once the article is opened. Fire-and-forget; failures are non-fatal.
    this.apollo
      .mutate({ mutation: RECORD_POST_VIEW, variables: { slug } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}

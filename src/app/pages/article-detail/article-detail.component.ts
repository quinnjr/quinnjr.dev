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
    <div class="min-h-screen bg-gray-900">
      <div class="container mx-auto max-w-3xl px-4 py-12">
        <a routerLink="/articles" class="text-blue-400 hover:underline">&larr; All articles</a>
        @if (post(); as p) {
          <article class="mt-6">
            <h1 class="text-4xl font-bold text-white mb-2">{{ p.title }}</h1>
            @if (p.author) {
              <p class="text-gray-400 mb-8">By {{ p.author.name }}</p>
            }
            <div class="prose prose-invert max-w-none" [innerHTML]="p.content"></div>
          </article>
        } @else if (loaded()) {
          <p class="mt-6 text-gray-400">Article not found.</p>
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

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import {
  type Observable,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { absoluteUrl } from '../../services/seo.config';
import { SeoService } from '../../services/seo.service';

const POST_BY_SLUG = gql`
  query Post($slug: String!) {
    post(slug: $slug) {
      id
      title
      content
      excerpt
      featuredImage
      seoTitle
      seoDescription
      publishedAt
      updatedAt
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
  excerpt: string | null;
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
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
        } @else if (failed()) {
          <div class="card-stone mt-10 p-8 text-center">
            <i class="fas fa-triangle-exclamation mb-3 text-3xl text-amber" aria-hidden="true"></i>
            <h2 class="font-medieval text-2xl text-parchment">The archive is unreachable</h2>
            <p class="mt-2 font-body text-muted">
              This entry could not be fetched from the archive. Try again in a moment.
            </p>
          </div>
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
  private readonly seo = inject(SeoService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly post = signal<ArticlePost | null>(null);
  readonly loaded = signal(false);
  /** True only for a transport/query failure — distinct from a genuine 404. */
  readonly failed = signal(false);

  ngOnInit(): void {
    // The router reuses this component when only :slug changes (/articles/a →
    // /articles/b), so reading the snapshot once would strand the first
    // article's body and metadata on every subsequent article.
    this.route.paramMap
      .pipe(
        map(params => params.get('slug')),
        distinctUntilChanged(),
        tap(slug => this.beginLoad(slug)),
        switchMap(slug => (slug ? this.fetchPost(slug) : of({ slug, post: null, failed: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ slug, post, failed }) => {
        this.post.set(post);
        this.failed.set(failed);
        this.loaded.set(true);
        // A failed fetch is not a missing article: publishing the noindex
        // "not found" metadata on an outage would de-index a live URL.
        if (slug && !failed) {
          this.applySeo(slug, post);
        }
      });
  }

  private beginLoad(slug: string | null): void {
    this.post.set(null);
    this.loaded.set(false);
    this.failed.set(false);

    // ngOnInit also runs on the server, where the mutation would count every
    // render (including crawler fetches) and then again after hydration.
    if (slug && this.isBrowser) {
      this.apollo
        .mutate({ mutation: RECORD_POST_VIEW, variables: { slug } })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ error: () => undefined });
    }
  }

  /** Never errors: a failure is folded into the emitted value so the outer
   *  paramMap stream survives and later slug changes still re-fetch. */
  private fetchPost(
    slug: string
  ): Observable<{ slug: string; post: ArticlePost | null; failed: boolean }> {
    return this.apollo
      .watchQuery<{ post: ArticlePost | null }>({ query: POST_BY_SLUG, variables: { slug } })
      .valueChanges.pipe(
        // Apollo Client 4 emits an in-flight result first and reports failures
        // as `result.error` rather than erroring the stream.
        filter(result => !result.loading),
        map(result => ({
          slug,
          post: result.error ? null : ((result.data?.post ?? null) as ArticlePost | null),
          failed: Boolean(result.error),
        })),
        catchError(() => of({ slug, post: null, failed: true }))
      );
  }

  private applySeo(slug: string, post: ArticlePost | null): void {
    const path = `/articles/${slug}`;

    // A missing article must not be indexable: without noindex the SPA returns
    // 200 with an empty shell, which is a soft 404 and dilutes crawl budget.
    if (!post) {
      this.seo.apply({
        title: 'Article not found',
        description: 'This entry could not be found in the archive.',
        path,
        noIndex: true,
      });
      this.seo.removeJsonLd('page');
      return;
    }

    const description =
      post.seoDescription ?? post.excerpt ?? this.summarise(post.content) ?? post.title;
    const image = post.featuredImage ?? undefined;
    const authorName = post.author?.name ?? 'Joseph R. Quinn';

    this.seo.apply({
      title: post.seoTitle ?? post.title,
      description,
      path,
      type: 'article',
      image,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? post.publishedAt ?? undefined,
    });

    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/home' },
      { name: 'Articles', path: '/articles' },
      { name: post.title, path },
    ]);

    this.seo.setJsonLd('page', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': absoluteUrl(path),
      mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) },
      headline: post.title,
      description,
      inLanguage: 'en-US',
      url: absoluteUrl(path),
      image: image ? absoluteUrl(image) : undefined,
      datePublished: post.publishedAt ?? undefined,
      dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
      wordCount: this.wordCount(post.content),
      author: { '@type': 'Person', name: authorName, url: absoluteUrl('/home') },
      publisher: { '@type': 'Person', name: 'Joseph R. Quinn', url: absoluteUrl('/home') },
    });
  }

  /** First ~155 characters of the body text, for posts with no excerpt set. */
  private summarise(html: string): string | null {
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) {
      return null;
    }
    return text.length <= 155 ? text : `${text.slice(0, 152).trimEnd()}…`;
  }

  private wordCount(html: string): number {
    return html
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;
  }
}

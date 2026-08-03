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

import { absoluteUrl } from '../../services/seo.config';
import { SeoService } from '../../services/seo.service';

const PUBLISHED_POSTS = gql`
  query PublishedPosts {
    publishedPosts {
      id
      title
      slug
      excerpt
      publishedAt
    }
  }
`;

interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesComponent implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);

  readonly posts = signal<PublishedPost[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Articles — Writing by Joseph R. Quinn',
      description:
        'Essays and technical writing by Joseph R. Quinn on software engineering, systems programming, infrastructure, and the places where technology meets law.',
      path: '/articles',
      keywords: ['Joseph R. Quinn blog', 'software engineering essays', 'technology law writing'],
    });

    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/home' },
      { name: 'Articles', path: '/articles' },
    ]);

    this.apollo
      .watchQuery<{ publishedPosts: PublishedPost[] }>({ query: PUBLISHED_POSTS })
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          // Apollo Client 4 emits the in-flight result first and reports a
          // failure as `result.error` rather than erroring the stream.
          if (result.loading) {
            return;
          }
          if (result.error) {
            this.handleFailure();
            return;
          }
          const posts = (result.data?.publishedPosts ?? []) as PublishedPost[];
          this.posts.set(posts);
          this.loading.set(false);
          this.error.set(null);
          this.publishItemList(posts);
        },
        error: () => this.handleFailure(),
      });
  }

  /** Without a distinct failure state the template's empty state claims there
   *  is nothing written, when in fact the archive could not be read. */
  private handleFailure(): void {
    this.posts.set([]);
    this.loading.set(false);
    this.error.set('The archive could not be reached.');
    this.publishItemList([]);
  }

  /** Exposes the index as a Blog with dated entries, so crawlers can pick up
   *  freshness signals and answer engines can enumerate the archive. */
  private publishItemList(posts: PublishedPost[]): void {
    this.seo.setJsonLd('page', {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': absoluteUrl('/articles'),
      url: absoluteUrl('/articles'),
      name: 'Articles — Writing by Joseph R. Quinn',
      inLanguage: 'en-US',
      author: { '@type': 'Person', name: 'Joseph R. Quinn' },
      blogPost: posts.map(post => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: absoluteUrl(`/articles/${post.slug}`),
        description: post.excerpt ?? undefined,
        datePublished: post.publishedAt ?? undefined,
        author: { '@type': 'Person', name: 'Joseph R. Quinn' },
      })),
    });
  }
}

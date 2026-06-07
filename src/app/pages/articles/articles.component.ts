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

import { CardComponent, CardBodyComponent } from '../../shared/components/ui';

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
  imports: [CommonModule, RouterLink, CardComponent, CardBodyComponent],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesComponent implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly destroyRef = inject(DestroyRef);

  readonly posts = signal<PublishedPost[]>([]);

  ngOnInit(): void {
    this.apollo
      .watchQuery<{ publishedPosts: PublishedPost[] }>({ query: PUBLISHED_POSTS })
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ data }) => this.posts.set((data?.publishedPosts ?? []) as PublishedPost[]));
  }
}

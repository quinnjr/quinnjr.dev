import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { NavigationComponent } from '../../components/navigation/navigation.component';
import { absoluteUrl } from '../../services/seo.config';
import { SeoService } from '../../services/seo.service';

import { CHAPTERS, type Chapter } from './chapters';

const MANIFESTO_TITLE = 'The SLM Manifesto — The Case Against Scale';

// The chapter list is a compile-time constant, so the `hasPart` graph never
// varies — build it once instead of on every navigation.
const MANIFESTO_HAS_PART = CHAPTERS.map((entry, index) => ({
  '@type': 'Article',
  position: index + 1,
  name: entry.title,
  url: absoluteUrl(`/slm/${entry.slug}`),
  abstract: entry.description,
}));

@Component({
  selector: 'app-slm-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavigationComponent],
  templateUrl: './slm-layout.component.html',
  styleUrl: './slm-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlmLayoutComponent {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  public readonly chapters = CHAPTERS;

  constructor() {
    // Chapters are child routes of one layout component, so the layout is the
    // only place that sees every chapter navigation — applying SEO here covers
    // all six without each chapter component repeating the wiring.
    effect(() => {
      const chapter = this.currentChapter();
      // `/slm` itself is only ever a waypoint to the redirect; labelling it
      // with the first chapter's title and canonical would advertise the wrong
      // URL for the fraction of a render before the redirect resolves.
      if (chapter) {
        this.applyChapterSeo(chapter);
      }
    });
  }

  // Current chapter slug, kept in sync with the active child route.
  private readonly currentSlug = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.slugFromUrl()),
      startWith(this.slugFromUrl())
    ),
    { initialValue: this.slugFromUrl() }
  );

  private readonly index = computed(() => CHAPTERS.findIndex(c => c.slug === this.currentSlug()));

  public readonly prev = computed(() => CHAPTERS[this.index() - 1] ?? null);
  public readonly next = computed(() => CHAPTERS[this.index() + 1] ?? null);

  /** `null` while the URL is not (yet) a chapter — notably at bare `/slm`. */
  public readonly currentChapter = computed<Chapter | null>(() =>
    this.index() < 0 ? null : CHAPTERS[this.index()]
  );

  private applyChapterSeo(chapter: Chapter): void {
    const position = this.index() + 1;
    const path = `/slm/${chapter.slug}`;

    this.seo.apply({
      title: `${chapter.title} — The SLM Manifesto`,
      description: chapter.description,
      path,
      type: 'article',
      keywords: [
        'small language models',
        'SLM manifesto',
        'AGI criticism',
        'AI economics',
        'frontier model costs',
        chapter.title.toLowerCase(),
      ],
    });

    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/home' },
      { name: 'SLM Manifesto', path: '/slm' },
      { name: chapter.title, path },
    ]);

    // Modelled as a chaptered Article rather than a bare WebPage: `isPartOf`
    // plus `position` is what lets a crawler reassemble the six URLs into one
    // work instead of treating them as six unrelated opinion pages.
    this.seo.setJsonLd('page', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': absoluteUrl(path),
      mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) },
      headline: `${chapter.title} — The SLM Manifesto`,
      description: chapter.description,
      inLanguage: 'en-US',
      url: absoluteUrl(path),
      position,
      author: { '@type': 'Person', name: 'Joseph R. Quinn', url: absoluteUrl('/home') },
      publisher: { '@type': 'Person', name: 'Joseph R. Quinn', url: absoluteUrl('/home') },
      isPartOf: {
        '@type': 'Article',
        '@id': absoluteUrl('/slm'),
        name: MANIFESTO_TITLE,
        url: absoluteUrl('/slm'),
        hasPart: MANIFESTO_HAS_PART,
      },
    });
  }

  private slugFromUrl(): string {
    // .../slm/<slug> — last non-empty path segment. Fragments are stripped
    // too: `/slm/evidence#charts` would otherwise yield `evidence#charts`,
    // match no chapter, and leave the previous route's metadata in place.
    return this.router.url.split(/[?#]/)[0].split('/').filter(Boolean).pop() ?? '';
  }
}

import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { SITE } from './seo.config';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let meta: Meta;
  let title: Title;

  const content = (selector: string): string | null =>
    meta.getTag(selector)?.getAttribute('content') ?? null;

  const canonical = (): string | null =>
    document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;

  const jsonLd = (key: string): Record<string, unknown> | null => {
    const script = document.head.querySelector(`script[data-seo-jsonld="${key}"]`);
    return script?.textContent ? (JSON.parse(script.textContent) as Record<string, unknown>) : null;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(SeoService);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
  });

  afterEach(() => {
    document.head.querySelectorAll('script[data-seo-jsonld]').forEach(node => node.remove());
    document.head.querySelector('link[rel="canonical"]')?.remove();
  });

  describe('apply', () => {
    it('sets a page-specific canonical rather than leaving the site root', () => {
      service.apply({ title: 'Resume', description: 'Background.', path: '/resume' });

      expect(canonical()).toBe(`${SITE.origin}/resume`);
      expect(content("property='og:url'")).toBe(`${SITE.origin}/resume`);
    });

    it('replaces the canonical on a subsequent navigation', () => {
      service.apply({ title: 'Resume', description: 'Background.', path: '/resume' });
      service.apply({ title: 'Projects', description: 'Work.', path: '/projects' });

      expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
      expect(canonical()).toBe(`${SITE.origin}/projects`);
    });

    it('suffixes the title with the author', () => {
      service.apply({ title: 'Projects', description: 'Work.', path: '/projects' });

      expect(title.getTitle()).toBe(`Projects | ${SITE.author}`);
    });

    it('does not repeat the author when the title already names them', () => {
      service.apply({
        title: `Resume — ${SITE.author}`,
        description: 'Background.',
        path: '/resume',
      });

      expect(title.getTitle()).toBe(`Resume — ${SITE.author}`);
    });

    it('does not repeat the site name when the title already carries it', () => {
      service.apply({ title: `About ${SITE.name}`, description: 'About.', path: '/home' });

      expect(title.getTitle()).toBe(`About ${SITE.name}`);
    });

    it('mirrors description into og and twitter tags', () => {
      service.apply({ title: 'Projects', description: 'Open-source work.', path: '/projects' });

      expect(content('name="description"')).toBe('Open-source work.');
      expect(content("property='og:description'")).toBe('Open-source work.');
      expect(content('name="twitter:description"')).toBe('Open-source work.');
    });

    it('resolves a relative image to an absolute URL', () => {
      service.apply({
        title: 'Post',
        description: 'A post.',
        path: '/articles/post',
        image: '/uploads/hero.png',
      });

      expect(content("property='og:image'")).toBe(`${SITE.origin}/uploads/hero.png`);
    });

    it('leaves an already-absolute image untouched', () => {
      service.apply({
        title: 'Post',
        description: 'A post.',
        path: '/articles/post',
        image: 'https://cdn.example.com/hero.png',
      });

      expect(content("property='og:image'")).toBe('https://cdn.example.com/hero.png');
    });

    it('emits an indexable robots directive by default', () => {
      service.apply({ title: 'Home', description: 'Home.', path: '/home' });

      expect(content('name="robots"')).toContain('index, follow');
    });

    it('emits noindex when asked', () => {
      service.apply({ title: 'Sign in', description: 'Auth.', path: '/login', noIndex: true });

      expect(content('name="robots"')).toBe('noindex, follow');
    });

    it('sets article timestamps only for article pages', () => {
      service.apply({
        title: 'Post',
        description: 'A post.',
        path: '/articles/post',
        type: 'article',
        publishedTime: '2026-01-02T00:00:00.000Z',
        modifiedTime: '2026-02-03T00:00:00.000Z',
      });

      expect(content("property='og:type'")).toBe('article');
      expect(content("property='article:published_time'")).toBe('2026-01-02T00:00:00.000Z');
      expect(content("property='article:modified_time'")).toBe('2026-02-03T00:00:00.000Z');
    });

    it('clears stale article timestamps when navigating to a non-article page', () => {
      service.apply({
        title: 'Post',
        description: 'A post.',
        path: '/articles/post',
        type: 'article',
        publishedTime: '2026-01-02T00:00:00.000Z',
      });
      service.apply({ title: 'Projects', description: 'Work.', path: '/projects' });

      expect(content("property='article:published_time'")).toBeNull();
    });

    it('clears stale keywords when navigating to a page that sets none', () => {
      service.apply({
        title: 'Home',
        description: 'Home.',
        path: '/home',
        keywords: ['Joseph R. Quinn', 'Angular developer'],
      });
      service.apply({ title: 'Sign in', description: 'Auth.', path: '/login', noIndex: true });

      expect(content('name="keywords"')).toBeNull();
    });

    it('replaces keywords rather than merging them across routes', () => {
      service.apply({ title: 'Home', description: 'Home.', path: '/home', keywords: ['home'] });
      service.apply({
        title: 'Projects',
        description: 'Work.',
        path: '/projects',
        keywords: ['projects'],
      });

      expect(content('name="keywords"')).toBe('projects');
    });

    it('sweeps a JSON-LD block the next route does not set', () => {
      service.apply({ title: 'Home', description: 'Home.', path: '/home' });
      service.setFaq([{ question: 'Who?', answer: 'Joseph R. Quinn.' }]);

      service.apply({ title: 'Projects', description: 'Work.', path: '/projects' });
      service.setBreadcrumbs([{ name: 'Projects', path: '/projects' }]);

      expect(jsonLd('faq')).toBeNull();
    });

    it('leaves exactly one node per block that the next route does re-set', () => {
      service.apply({ title: 'Home', description: 'Home.', path: '/home' });
      service.setBreadcrumbs([{ name: 'Home', path: '/home' }]);
      service.setJsonLd('page', { '@type': 'ProfilePage', name: 'Home' });

      service.apply({ title: 'Projects', description: 'Work.', path: '/projects' });
      service.setBreadcrumbs([{ name: 'Projects', path: '/projects' }]);
      service.setJsonLd('page', { '@type': 'CollectionPage', name: 'Projects' });

      expect(document.head.querySelectorAll('script[data-seo-jsonld="page"]').length).toBe(1);
      expect(document.head.querySelectorAll('script[data-seo-jsonld="breadcrumbs"]').length).toBe(
        1
      );
      expect(jsonLd('page')).toEqual({ '@type': 'CollectionPage', name: 'Projects' });
    });

    it('still yields one of each block when the same route re-applies', () => {
      const render = (): void => {
        service.apply({ title: 'Post', description: 'A post.', path: '/articles/post' });
        service.setBreadcrumbs([{ name: 'Articles', path: '/articles' }]);
        service.setJsonLd('page', { '@type': 'BlogPosting', name: 'Post' });
      };

      render();
      render();

      expect(document.head.querySelectorAll('script[data-seo-jsonld]').length).toBe(2);
      expect(jsonLd('page')).toEqual({ '@type': 'BlogPosting', name: 'Post' });
    });

    it('leaves the sitewide graphs from index.html alone', () => {
      const sitewide = document.createElement('script');
      sitewide.setAttribute('type', 'application/ld+json');
      sitewide.setAttribute('data-spec-sitewide', '');
      sitewide.textContent = JSON.stringify({ '@type': 'WebSite' });
      document.head.appendChild(sitewide);

      service.apply({ title: 'Home', description: 'Home.', path: '/home' });

      expect(document.head.querySelector('script[data-spec-sitewide]')).not.toBeNull();
      sitewide.remove();
    });
  });

  describe('structured data', () => {
    it('inserts a keyed JSON-LD block', () => {
      service.setJsonLd('page', { '@type': 'WebPage', name: 'Test' });

      expect(jsonLd('page')).toEqual({ '@type': 'WebPage', name: 'Test' });
    });

    it('replaces rather than appends on repeat calls with the same key', () => {
      service.setJsonLd('page', { '@type': 'WebPage', name: 'First' });
      service.setJsonLd('page', { '@type': 'WebPage', name: 'Second' });

      expect(document.head.querySelectorAll('script[data-seo-jsonld="page"]').length).toBe(1);
      expect(jsonLd('page')).toEqual({ '@type': 'WebPage', name: 'Second' });
    });

    it('removes a block on request', () => {
      service.setJsonLd('page', { '@type': 'WebPage' });
      service.removeJsonLd('page');

      expect(jsonLd('page')).toBeNull();
    });

    it('honours a page that removes blocks explicitly after applying', () => {
      service.apply({ title: 'Home', description: 'Home.', path: '/home' });
      service.setBreadcrumbs([{ name: 'Home', path: '/home' }]);
      service.setJsonLd('page', { '@type': 'ProfilePage' });
      service.setFaq([{ question: 'Who?', answer: 'Joseph R. Quinn.' }]);

      // LoginComponent's sequence: the sweep already covers it, but the
      // explicit removals must stay harmless rather than throwing on absence.
      service.apply({ title: 'Sign in', description: 'Auth.', path: '/login', noIndex: true });
      service.removeJsonLd('page');
      service.removeJsonLd('faq');
      service.removeJsonLd('breadcrumbs');

      expect(document.head.querySelectorAll('script[data-seo-jsonld]').length).toBe(0);
    });

    it('numbers breadcrumb positions from one and absolutises items', () => {
      service.setBreadcrumbs([
        { name: 'Home', path: '/home' },
        { name: 'Articles', path: '/articles' },
      ]);

      expect(jsonLd('breadcrumbs')).toEqual({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE.origin}/home`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Articles',
            item: `${SITE.origin}/articles`,
          },
        ],
      });
    });

    it('builds an FAQPage from question/answer pairs', () => {
      service.setFaq([{ question: 'Who?', answer: 'Joseph R. Quinn.' }]);

      expect(jsonLd('faq')).toEqual({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Who?',
            acceptedAnswer: { '@type': 'Answer', text: 'Joseph R. Quinn.' },
          },
        ],
      });
    });
  });
});

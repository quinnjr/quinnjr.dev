import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { SITE, absoluteUrl } from './seo.config';

export interface SeoMeta {
  /** Page title, without the site suffix — the service appends it. */
  title: string;
  /** 120–160 characters. Unique per route; duplicates read as thin content. */
  description: string;
  /** Site-relative canonical path. Defaults to the current router URL. */
  path?: string;
  /** Site-relative or absolute social-card image. */
  image?: string;
  imageAlt?: string;
  /** Open Graph object type. `article` for anything with a byline/date. */
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  /** ISO-8601. Only meaningful when `type` is `article`. */
  publishedTime?: string;
  modifiedTime?: string;
  /** Emits `noindex, follow` — for utility routes that must not rank. */
  noIndex?: boolean;
}

/**
 * Applies per-route metadata for search engines and answer engines.
 *
 * Without this, every route inherits `index.html` verbatim — including its
 * `<link rel="canonical" href="https://quinnjr.dev/">`, which tells crawlers
 * that every subpage is a duplicate of the home page and should be dropped
 * from the index. Each page must therefore call `apply()`.
 *
 * Runs identically under SSR and in the browser: it only touches `Title`,
 * `Meta`, and `DOCUMENT`, all of which Angular provides on the server, so the
 * tags are present in the delivered HTML rather than being painted in after
 * hydration — which is the only form crawlers and LLM fetchers reliably read.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  apply(config: SeoMeta): void {
    // Skip the suffix when the title already names the site or the author —
    // "Resume — Joseph R. Quinn | Joseph R. Quinn" wastes the ~60 characters
    // a result actually shows.
    const alreadyBranded = config.title.includes(SITE.name) || config.title.includes(SITE.author);
    const fullTitle = alreadyBranded ? config.title : `${config.title} | ${SITE.author}`;
    const path = config.path ?? this.currentPath();
    const canonical = absoluteUrl(path);
    const image = absoluteUrl(config.image ?? SITE.defaultImage);
    const type = config.type ?? 'website';

    // Structured data is per-URL by definition, so the previous route's blocks
    // are swept here and each page repopulates its own straight after: every
    // call site calls `apply()` first and its `setJsonLd`/`setBreadcrumbs`/
    // `setFaq` calls after. Leaving them in place let /home's FAQPage ride along
    // to /projects, claiming that URL answers "Who is Joseph R. Quinn?" — and it
    // is what made a client-side navigation disagree with the SSR'd head, since
    // a server render always starts from an empty document.
    this.sweepJsonLd();

    this.titleService.setTitle(fullTitle);

    this.setName('title', fullTitle);
    this.setName('description', config.description);
    this.setName(
      'robots',
      config.noIndex
        ? 'noindex, follow'
        : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    // Most routes set keywords and two (login, article-detail) set none, so a
    // stale value would follow the user onto pages it does not describe —
    // including /login, which is explicitly noindex. Clear, then re-set.
    this.meta.removeTag('name="keywords"');
    if (config.keywords?.length) {
      this.setName('keywords', config.keywords.join(', '));
    }

    this.setProperty('og:type', type);
    this.setProperty('og:url', canonical);
    this.setProperty('og:title', fullTitle);
    this.setProperty('og:description', config.description);
    this.setProperty('og:image', image);
    this.setProperty('og:image:alt', config.imageAlt ?? SITE.defaultImageAlt);

    this.setName('twitter:url', canonical);
    this.setName('twitter:title', fullTitle);
    this.setName('twitter:description', config.description);
    this.setName('twitter:image', image);
    this.setName('twitter:image:alt', config.imageAlt ?? SITE.defaultImageAlt);

    // `og:site_name`, `og:locale`, `twitter:card`, `twitter:creator`,
    // `twitter:site` and `author` are deliberately absent: they are
    // route-invariant and already hard-coded in index.html, so rewriting them
    // here cost six `head` querySelector traversals per navigation to
    // overwrite each tag with the value it already held.

    // article:* only applies to og:type=article; stale values on a subsequent
    // website-type route would misdate that page, so always clear then re-set.
    this.meta.removeTag("property='article:published_time'");
    this.meta.removeTag("property='article:modified_time'");
    this.meta.removeTag("property='article:author'");
    if (type === 'article') {
      if (config.publishedTime) {
        this.setProperty('article:published_time', config.publishedTime);
      }
      if (config.modifiedTime) {
        this.setProperty('article:modified_time', config.modifiedTime);
      }
      this.setProperty('article:author', SITE.author);
    }

    this.setCanonical(canonical);
  }

  /**
   * Inserts or replaces a keyed JSON-LD block. The key lets a route replace
   * only its own graph on navigation instead of appending a new one each time;
   * keys the next route does not set are dropped by the sweep in `apply()`.
   */
  setJsonLd(key: string, data: unknown): void {
    const { head } = this.document;

    let script = head.querySelector<HTMLScriptElement>(`script[data-seo-jsonld="${key}"]`);
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo-jsonld', key);
      head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  removeJsonLd(key: string): void {
    this.document.head.querySelector(`script[data-seo-jsonld="${key}"]`)?.remove();
  }

  /**
   * Emits a BreadcrumbList. Answer engines lean on this to state where a page
   * sits in the site, and Google renders it as the result's path line.
   */
  setBreadcrumbs(trail: Array<{ name: string; path: string }>): void {
    this.setJsonLd('breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    });
  }

  /**
   * Emits an FAQPage. This is the highest-leverage AEO primitive: it hands an
   * answer engine a question and a self-contained answer it can quote without
   * having to infer either from prose.
   */
  setFaq(entries: Array<{ question: string; answer: string }>): void {
    this.setJsonLd('faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: entries.map(entry => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: { '@type': 'Answer', text: entry.answer },
      })),
    });
  }

  /**
   * Drops every block this service owns. Keyed on the `data-seo-jsonld`
   * attribute so the sitewide graphs hand-written in `index.html` — which carry
   * no key and describe the site rather than a route — survive untouched.
   */
  private sweepJsonLd(): void {
    this.document.head
      .querySelectorAll('script[data-seo-jsonld]')
      .forEach(script => script.remove());
  }

  /** Router URL without query string or fragment — canonicals carry neither. */
  private currentPath(): string {
    return this.router.url.split(/[?#]/)[0] || '/';
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private setCanonical(href: string): void {
    const { head } = this.document;

    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}

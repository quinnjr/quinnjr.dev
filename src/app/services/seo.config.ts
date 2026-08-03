/**
 * Single source of truth for site-wide SEO/AEO identity.
 *
 * `origin` is the canonical origin. Every canonical/og:url the app emits is
 * built from it, so alternate hostnames (www, *.ondigitalocean.app, the
 * quinnjr.tech brand alias) all point their canonical at one host instead of
 * splitting ranking signals across duplicates.
 */
export const SITE = {
  origin: 'https://quinnjr.dev',
  name: 'quinnjr.dev',
  shortName: 'quinnjr.dev',
  author: 'Joseph R. Quinn',
  authorSuffix: 'Esq.',
  twitterHandle: '@quinnjr',
  locale: 'en_US',
  /** Sitewide social-card image. Must be a real file under `public/`. */
  defaultImage: '/assets/og-image.png',
  defaultImageWidth: 1200,
  defaultImageHeight: 630,
  defaultImageAlt: 'Joseph R. Quinn — software engineer, attorney, technologist',
} as const;

/** Absolute URL for a site-relative path. Idempotent for absolute inputs. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${SITE.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

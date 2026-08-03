import { Router } from 'express';
import { container } from 'tsyringe';

import { SitemapService } from '../services/sitemap.service';

const router = Router();

/**
 * Resolved per request, not at module load: server.ts imports the route modules
 * before initializeContainer() runs, so a module-scope resolve would build its
 * own instance instead of the container's registered singleton.
 */
const sitemap = () => container.resolve(SitemapService);

/**
 * Canonical origin for everything these routes emit.
 *
 * Deriving it from the request produced `http://` URLs behind the
 * TLS-terminating proxy, and advertised whichever host the crawler happened to
 * use (`*.ondigitalocean.app`, an IP, a preview domain). Both are duplicate
 * content: a sitemap has to list the one origin the canonical tags point at.
 * Override with SITE_ORIGIN for other deploy targets.
 */
const SITE_ORIGIN = (process.env['SITE_ORIGIN'] ?? 'https://quinnjr.dev').replace(/\/+$/, '');

const CONTENT_TYPE = 'Content-Type';
const CACHE_CONTROL = 'Cache-Control';
const CACHE_ONE_HOUR = 'public, max-age=3600';
const CACHE_TTL_MS = 3600 * 1000;

interface RenderedDocument {
  body: Promise<string>;
  expiresAt: number;
}

/** Rendered bodies, keyed by route. These documents are identical for every
 * caller for the whole hour the Cache-Control header advertises, so re-querying
 * and re-serializing per request was pure waste — a crawler hitting sitemap.xml
 * repeatedly used to re-read every published post each time.
 *
 * The entry holds the in-flight *promise*, not the resolved string: caching
 * only the settled value still let every concurrent request that arrived during
 * the first render run its own `findMany`, which is exactly the stampede the
 * cache exists to prevent. A rejected render is evicted so the next request
 * retries instead of serving a poisoned entry for an hour. */
const rendered = new Map<string, RenderedDocument>();

function renderCached(key: string, render: () => string | Promise<string>): Promise<string> {
  const now = Date.now();
  const hit = rendered.get(key);
  if (hit && now < hit.expiresAt) {
    return hit.body;
  }
  const body: Promise<string> = Promise.resolve()
    .then(render)
    .catch((error: unknown) => {
      // Only evict if this entry is still the current one; a later successful
      // render must not be thrown away by an earlier failure settling late.
      if (rendered.get(key)?.body === body) {
        rendered.delete(key);
      }
      throw error;
    });
  rendered.set(key, { body, expiresAt: now + CACHE_TTL_MS });
  return body;
}

/**
 * Generate sitemap.xml with static Angular routes and dynamic blog posts
 */
router.get('/sitemap.xml', async (_req, res): Promise<void> => {
  try {
    const xml = await renderCached('sitemap.xml', async () => {
      const service = sitemap();
      const urls = await service.generateSitemapUrls(SITE_ORIGIN);
      return service.generateSitemapXml(urls);
    });

    res.header(CONTENT_TYPE, 'application/xml');
    res.header(CACHE_CONTROL, CACHE_ONE_HOUR);
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Generate robots.txt
 */
router.get('/robots.txt', async (_req, res): Promise<void> => {
  try {
    const robotsTxt = await renderCached('robots.txt', () =>
      sitemap().generateRobotsTxt(SITE_ORIGIN)
    );

    res.header(CONTENT_TYPE, 'text/plain');
    res.header(CACHE_CONTROL, CACHE_ONE_HOUR);
    res.send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
});

/**
 * Generate llms.txt — a plain-text site summary for answer engines.
 */
router.get('/llms.txt', async (_req, res): Promise<void> => {
  try {
    const llmsTxt = await renderCached('llms.txt', () => sitemap().generateLlmsTxt(SITE_ORIGIN));

    res.header(CONTENT_TYPE, 'text/plain; charset=utf-8');
    res.header(CACHE_CONTROL, CACHE_ONE_HOUR);
    res.send(llmsTxt);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    res.status(500).send('Error generating llms.txt');
  }
});

export default router;

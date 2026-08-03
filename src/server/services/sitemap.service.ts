import { inject, singleton } from 'tsyringe';

import { CHAPTERS } from '../../app/pages/slm/chapters';

import { DatabaseService } from './database.service';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

/**
 * Routes that exist in `app.routes.ts` and should always be advertised, even
 * on a database with no `sitemapConfig` rows seeded. The DB table can add to
 * this list but is no longer the sole source: a sitemap that silently empties
 * when a seed is skipped is worse than a static one.
 *
 * `/login` and `/admin` are deliberately absent — they carry `noindex`.
 */
const STATIC_ROUTES: readonly SitemapUrl[] = [
  { loc: '/', changefreq: 'weekly', priority: 1.0 },
  { loc: '/home', changefreq: 'weekly', priority: 1.0 },
  { loc: '/articles', changefreq: 'daily', priority: 0.9 },
  { loc: '/projects', changefreq: 'weekly', priority: 0.8 },
  { loc: '/resume', changefreq: 'monthly', priority: 0.8 },
];

/**
 * Routes that must never reach a sitemap regardless of what the DB holds.
 *
 * `/slm` is excluded because it redirects to `/slm/introduction` and
 * self-canonicalises there; a sitemap should only list canonical URLs. The
 * chapters themselves are added below.
 */
const EXCLUDED_ROUTES = new Set(['/login', '/admin', '/callback', '/blog', '/slm']);

/**
 * Paths withheld from every crawler: the authenticated areas, the OAuth
 * callback, and the GraphQL endpoint. Both robots.txt groups are generated from
 * this one list — when the named groups carried their own shorter copy they
 * left /callback and /graphql open to precisely the agents the named groups
 * exist for.
 */
const DISALLOWED_PATHS = ['/admin', '/login', '/callback', '/graphql'] as const;

/**
 * Crawlers granted explicit access. Listing them individually matters because
 * several of these agents ignore the `User-agent: *` group once any named
 * group exists in the file.
 */
const ALLOWED_AGENTS = [
  // Search
  'Googlebot',
  'Googlebot-Image',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  // Answer engines / model retrieval
  'Google-Extended',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'Meta-ExternalAgent',
  // Social unfurlers
  'Twitterbot',
  'facebookexternalhit',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
] as const;

/**
 * Service for generating sitemap.xml, robots.txt, and llms.txt
 */
@singleton()
export class SitemapService {
  constructor(@inject(DatabaseService) private readonly db: DatabaseService) {}

  private get prisma() {
    return this.db.getClient();
  }

  /**
   * Generate sitemap URLs
   */
  async generateSitemapUrls(baseUrl: string): Promise<SitemapUrl[]> {
    const urls = new Map<string, SitemapUrl>();

    const add = (url: SitemapUrl): void => {
      if (EXCLUDED_ROUTES.has(url.loc)) {
        return;
      }
      urls.set(url.loc, { ...url, loc: `${baseUrl}${url.loc}` });
    };

    STATIC_ROUTES.forEach(add);

    // Manifesto chapters are real, separately indexable URLs and are the site's
    // deepest original content — omitting them left the strongest pages on the
    // site discoverable only by crawling the table of contents.
    CHAPTERS.forEach(chapter => {
      add({ loc: `/slm/${chapter.slug}`, changefreq: 'monthly', priority: 0.7 });
    });

    // Database-backed entries are additive. A crawler that gets a 500 here may
    // drop the whole sitemap, so a database outage degrades to the static
    // routes above rather than taking the entire file down with it.
    try {
      const staticRoutes = await this.prisma.sitemapConfig.findMany({
        where: { isStatic: true },
      });

      staticRoutes.forEach((route: { url: string; changefreq: string; priority: number }) => {
        add({ loc: route.url, changefreq: route.changefreq, priority: route.priority });
      });

      // Published posts. The route is `/articles/:slug` (see app.routes.ts) —
      // the sitemap previously advertised `/blog/:slug`, which 404s, alongside
      // `/blog/category/*` and `/blog/tag/*` routes that do not exist at all.
      const blogPosts = await this.prisma.blogPost.findMany({
        where: {
          status: 'PUBLISHED',
          noIndex: false,
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });

      blogPosts.forEach((post: { slug: string; updatedAt: Date; publishedAt: Date | null }) => {
        add({
          loc: `/articles/${post.slug}`,
          lastmod: post.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: 0.8,
        });
      });
    } catch (error) {
      console.error('Sitemap: database unavailable, serving static routes only:', error);
    }

    return [...urls.values()];
  }

  /**
   * Generate XML sitemap
   */
  generateSitemapXml(urls: SitemapUrl[]): string {
    const urlEntries = urls
      .map(url => {
        let entry = `  <url>\n    <loc>${this.escapeXml(url.loc)}</loc>\n`;

        if (url.lastmod) {
          entry += `    <lastmod>${url.lastmod}</lastmod>\n`;
        }

        if (url.changefreq) {
          entry += `    <changefreq>${url.changefreq}</changefreq>\n`;
        }

        if (url.priority !== undefined) {
          entry += `    <priority>${url.priority}</priority>\n`;
        }

        entry += '  </url>';
        return entry;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(baseUrl: string): string {
    const disallows = DISALLOWED_PATHS.map(path => `Disallow: ${path}`).join('\n');
    const namedGroups = ALLOWED_AGENTS.map(
      agent => `User-agent: ${agent}\nAllow: /\n${disallows}\n`
    ).join('\n');

    return `# robots.txt for ${baseUrl}
# Crawling and answer-engine retrieval are welcome; only the authenticated
# areas and the GraphQL endpoint are off limits.

User-agent: *
Allow: /
${disallows}

${namedGroups}
# Machine-readable site summary for language models:
# ${baseUrl}/llms.txt

Sitemap: ${baseUrl}/sitemap.xml
`;
  }

  /**
   * Generate llms.txt — a plain-text site summary aimed at language models.
   *
   * Answer engines retrieving this site otherwise have to infer its structure
   * from rendered HTML. This states, in a single fetch, who the site is about,
   * what lives at which URL, and what each section argues.
   */
  async generateLlmsTxt(baseUrl: string): Promise<string> {
    // As with the sitemap, the article list is the only database-dependent
    // section; losing it must not cost the site its machine-readable summary.
    let posts: Array<{ slug: string; title: string; excerpt: string | null }> = [];
    try {
      posts = await this.prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', noIndex: false },
        select: { slug: true, title: true, excerpt: true },
        orderBy: { publishedAt: 'desc' },
        take: 50,
      });
    } catch (error) {
      console.error('llms.txt: database unavailable, omitting article list:', error);
    }

    const chapterLines = CHAPTERS.map(
      chapter => `- [${chapter.title}](${baseUrl}/slm/${chapter.slug}): ${chapter.description}`
    ).join('\n');

    const postLines = posts.length
      ? posts
          .map(
            post =>
              `- [${post.title}](${baseUrl}/articles/${post.slug})${post.excerpt ? `: ${post.excerpt}` : ''}`
          )
          .join('\n')
      : '- No articles are published yet.';

    return `# quinnjr.dev

> The personal site of Joseph R. Quinn, Esq. — a full-stack software engineer
> and attorney based in Miami, Florida. He builds systems in Rust, Go, and
> TypeScript, works on cloud and Kubernetes infrastructure, and holds a Juris
> Doctor from the University of Miami School of Law. The site hosts his resume,
> open-source work, essays, and a long-form manifesto arguing for small
> language models over frontier-scale AI.

## Pages

- [Home](${baseUrl}/home): Profile, technical skills, and certifications.
- [Resume](${baseUrl}/resume): Professional and educational background.
- [Projects](${baseUrl}/projects): Open-source repositories, generated live from GitHub.
- [Articles](${baseUrl}/articles): Essays and technical writing.
- [The SLM Manifesto](${baseUrl}/slm): Long-form argument against frontier-scale AI.

## The SLM Manifesto

A six-chapter argument that the pursuit of artificial general intelligence
misallocates capital, talent, and electricity, and that small language models
are the better instrument for nearly all real work.

${chapterLines}

## Articles

${postLines}

## Elsewhere

- [GitHub](https://github.com/quinnjr)
- [LinkedIn](https://www.linkedin.com/in/quinnjosephr/)
- [Parkinson's Disease Map](https://parkinsons.quinnjr.dev/)

## Notes

- Canonical origin: ${baseUrl}
- Sitemap: ${baseUrl}/sitemap.xml
- Content is authored by Joseph R. Quinn unless stated otherwise. Attribution
  with a link back to the source URL is requested when quoting.
`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

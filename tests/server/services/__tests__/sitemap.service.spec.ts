import { vi } from 'vitest';

import { type DatabaseService } from '../../../../src/server/services/database.service';
import { SitemapService } from '../../../../src/server/services/sitemap.service';

import { createMockPrismaClient } from './helpers';

// Mock PrismaClient before importing services
vi.mock('../../../../src/generated/prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

describe('SitemapService', () => {
  let service: SitemapService;
  let mockDatabaseService: { getClient: ReturnType<typeof vi.fn> };
  let mockPrismaClient: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrismaClient = createMockPrismaClient();

    mockDatabaseService = {
      getClient: vi.fn().mockReturnValue(mockPrismaClient),
    };

    service = new SitemapService(mockDatabaseService as unknown as DatabaseService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSitemapUrls', () => {
    beforeEach(() => {
      mockPrismaClient.sitemapConfig.findMany.mockResolvedValue([]);
      mockPrismaClient.blogPost.findMany.mockResolvedValue([]);
    });

    it('should generate sitemap URLs from database', async () => {
      const baseUrl = 'https://example.com';

      mockPrismaClient.sitemapConfig.findMany.mockResolvedValue([
        { url: '/', changefreq: 'daily', priority: 1.0 },
        { url: '/about', changefreq: 'monthly', priority: 0.8 },
      ]);

      mockPrismaClient.blogPost.findMany.mockResolvedValue([
        {
          slug: 'test-post',
          updatedAt: new Date('2025-01-01'),
          publishedAt: new Date('2025-01-01'),
        },
      ]);

      const urls = await service.generateSitemapUrls(baseUrl);

      expect(urls).toContainEqual({
        loc: 'https://example.com/',
        changefreq: 'daily',
        priority: 1.0,
      });
      expect(urls).toContainEqual(
        expect.objectContaining({ loc: 'https://example.com/about', priority: 0.8 })
      );
    });

    it('should publish posts under /articles, not the non-existent /blog route', async () => {
      mockPrismaClient.blogPost.findMany.mockResolvedValue([
        {
          slug: 'test-post',
          updatedAt: new Date('2025-01-01'),
          publishedAt: new Date('2025-01-01'),
        },
      ]);

      const urls = await service.generateSitemapUrls('https://example.com');
      const locs = urls.map(u => u.loc);

      expect(locs).toContain('https://example.com/articles/test-post');
      expect(locs).not.toContain('https://example.com/blog/test-post');
    });

    it('should include the canonical static routes without any database rows', async () => {
      const locs = (await service.generateSitemapUrls('https://example.com')).map(u => u.loc);

      expect(locs).toEqual(
        expect.arrayContaining([
          'https://example.com/',
          'https://example.com/home',
          'https://example.com/articles',
          'https://example.com/projects',
          'https://example.com/resume',
        ])
      );
    });

    it('should omit /slm, which redirects and self-canonicalises to a chapter', async () => {
      const locs = (await service.generateSitemapUrls('https://example.com')).map(u => u.loc);

      expect(locs).not.toContain('https://example.com/slm');
      expect(locs).toContain('https://example.com/slm/introduction');
    });

    it('should include every manifesto chapter', async () => {
      const locs = (await service.generateSitemapUrls('https://example.com')).map(u => u.loc);

      expect(locs).toEqual(
        expect.arrayContaining([
          'https://example.com/slm/introduction',
          'https://example.com/slm/definitions',
          'https://example.com/slm/evidence',
          'https://example.com/slm/costs',
          'https://example.com/slm/backlash',
          'https://example.com/slm/overkill',
        ])
      );
    });

    it('should exclude noindex routes even when the database lists them', async () => {
      mockPrismaClient.sitemapConfig.findMany.mockResolvedValue([
        { url: '/login', changefreq: 'yearly', priority: 0.3 },
        { url: '/admin', changefreq: 'yearly', priority: 0.3 },
        { url: '/blog', changefreq: 'daily', priority: 0.9 },
      ]);

      const locs = (await service.generateSitemapUrls('https://example.com')).map(u => u.loc);

      expect(locs).not.toContain('https://example.com/login');
      expect(locs).not.toContain('https://example.com/admin');
      expect(locs).not.toContain('https://example.com/blog');
    });

    it('should still serve the static routes when the database is unreachable', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockPrismaClient.sitemapConfig.findMany.mockRejectedValue(new Error('db down'));

      const locs = (await service.generateSitemapUrls('https://example.com')).map(u => u.loc);

      expect(locs).toContain('https://example.com/home');
      expect(locs).toContain('https://example.com/slm/introduction');
      spy.mockRestore();
    });

    it('should not emit duplicate URLs', async () => {
      mockPrismaClient.sitemapConfig.findMany.mockResolvedValue([
        { url: '/home', changefreq: 'daily', priority: 1.0 },
      ]);

      const locs = (await service.generateSitemapUrls('https://example.com')).map(u => u.loc);

      expect(new Set(locs).size).toBe(locs.length);
    });
  });

  describe('generateSitemapXml', () => {
    it('should generate valid XML sitemap', () => {
      const urls = [
        { loc: 'https://example.com/', priority: 1.0, changefreq: 'daily' },
        { loc: 'https://example.com/about', priority: 0.8, changefreq: 'monthly' },
      ];

      const xml = service.generateSitemapXml(urls);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('<loc>https://example.com/</loc>');
      expect(xml).toContain('<priority>1</priority>');
      expect(xml).toContain('<changefreq>daily</changefreq>');
      expect(xml).toContain('</urlset>');
    });

    it('should escape XML special characters', () => {
      const urls = [{ loc: 'https://example.com/test?param=1&other=2', priority: 0.5 }];

      const xml = service.generateSitemapXml(urls);

      expect(xml).toContain('&amp;');
      expect(xml).not.toContain('?param=1&other=2');
    });

    // `changefreq` and `priority` come straight from the operator-editable
    // `sitemapConfig` table. One row carrying `<` or `&` used to be enough to
    // make the whole document malformed, and crawlers reject an invalid
    // sitemap wholesale rather than skipping the bad entry.
    it('should drop a changefreq that is not one of the sitemap enum values', () => {
      const xml = service.generateSitemapXml([
        { loc: 'https://example.com/x', changefreq: '<script>weekly' },
      ]);

      expect(xml).not.toContain('<script>');
      expect(xml).not.toContain('<changefreq>');
    });

    it('should keep every legitimate changefreq value', () => {
      const xml = service.generateSitemapXml([
        { loc: 'https://example.com/x', changefreq: 'always' },
        { loc: 'https://example.com/y', changefreq: 'never' },
      ]);

      expect(xml).toContain('<changefreq>always</changefreq>');
      expect(xml).toContain('<changefreq>never</changefreq>');
    });

    it('should coerce priority to a number and omit it when it is not one', () => {
      const xml = service.generateSitemapXml([
        { loc: 'https://example.com/x', priority: '0.5</priority><!--' as unknown as number },
      ]);

      expect(xml).not.toContain('<!--');
      expect(xml).not.toContain('<priority>');
    });

    it('should escape lastmod rather than interpolating it raw', () => {
      const xml = service.generateSitemapXml([
        { loc: 'https://example.com/x', lastmod: '2025-01-01 & later' },
      ]);

      expect(xml).toContain('<lastmod>2025-01-01 &amp; later</lastmod>');
    });

    it('should stay well-formed when a database row carries XML metacharacters', () => {
      const xml = service.generateSitemapXml([
        {
          loc: 'https://example.com/a&b',
          lastmod: '<bad>',
          changefreq: 'a&b',
          priority: NaN,
        },
      ]);

      expect(xml).toContain('<loc>https://example.com/a&amp;b</loc>');
      expect(xml).toContain('<lastmod>&lt;bad&gt;</lastmod>');
      expect(xml).not.toContain('<bad>');
      // `a&b` is not a valid changefreq, and NaN is not a usable priority.
      expect(xml).not.toContain('<changefreq>');
      expect(xml).not.toContain('<priority>');
    });
  });

  describe('generateRobotsTxt', () => {
    it('should generate valid robots.txt', () => {
      const robotsTxt = service.generateRobotsTxt('https://example.com');

      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
      expect(robotsTxt).toContain('Sitemap: https://example.com/sitemap.xml');
      expect(robotsTxt).toContain('Disallow: /admin');
      expect(robotsTxt).toContain('Disallow: /login');
    });

    it('should grant named answer-engine crawlers explicit access', () => {
      const robotsTxt = service.generateRobotsTxt('https://example.com');

      for (const agent of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
        expect(robotsTxt).toContain(`User-agent: ${agent}`);
      }
    });

    it('should disallow the same paths in the wildcard group and the named groups', () => {
      const robotsTxt = service.generateRobotsTxt('https://example.com');
      const disallowed = ['/admin', '/login', '/callback', '/graphql'];

      // Named agents ignore `User-agent: *` once any named group exists, so a
      // path missing from a named group is simply unprotected for that crawler.
      const groupFor = (agent: string): string =>
        robotsTxt.split(`User-agent: ${agent}\n`)[1].split('\n\n')[0];

      for (const path of disallowed) {
        expect(robotsTxt).toContain(`Disallow: ${path}`);
      }

      for (const agent of ['GPTBot', 'ClaudeBot', 'Googlebot']) {
        const group = groupFor(agent);
        for (const path of disallowed) {
          expect(group).toContain(`Disallow: ${path}`);
        }
      }
    });

    it('should not block the sitemap or other XML resources', () => {
      const robotsTxt = service.generateRobotsTxt('https://example.com');

      expect(robotsTxt).not.toContain('Disallow: /*.xml');
    });
  });

  describe('generateLlmsTxt', () => {
    beforeEach(() => {
      mockPrismaClient.blogPost.findMany.mockResolvedValue([]);
    });

    it('should describe the site and link every manifesto chapter', async () => {
      const llms = await service.generateLlmsTxt('https://example.com');

      expect(llms).toContain('# quinnjr.dev');
      expect(llms).toContain('Joseph R. Quinn');
      expect(llms).toContain('https://example.com/slm/introduction');
      expect(llms).toContain('https://example.com/slm/overkill');
      expect(llms).toContain('Sitemap: https://example.com/sitemap.xml');
    });

    it('should list published articles by their real URL', async () => {
      mockPrismaClient.blogPost.findMany.mockResolvedValue([
        { slug: 'a-post', title: 'A Post', excerpt: 'An excerpt.' },
      ]);

      const llms = await service.generateLlmsTxt('https://example.com');

      expect(llms).toContain('[A Post](https://example.com/articles/a-post): An excerpt.');
    });

    it('should still describe the site when the database is unreachable', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockPrismaClient.blogPost.findMany.mockRejectedValue(new Error('db down'));

      const llms = await service.generateLlmsTxt('https://example.com');

      expect(llms).toContain('# quinnjr.dev');
      expect(llms).toContain('https://example.com/slm/introduction');
      spy.mockRestore();
    });

    it('should say so plainly when nothing is published', async () => {
      const llms = await service.generateLlmsTxt('https://example.com');

      expect(llms).toContain('No articles are published yet.');
    });
  });
});

// Mock PrismaClient before importing services
jest.mock('../../../generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client';
import { SitemapService } from '../sitemap.service';
import { DatabaseService } from '../database.service';

describe('SitemapService', () => {
  let service: SitemapService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockPrismaClient: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    // Create deep mock Prisma client using jest-mock-extended
    mockPrismaClient = mockDeep<PrismaClient>();

    mockDatabaseService = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
    } as unknown as jest.Mocked<DatabaseService>;

    service = new SitemapService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSitemapUrls', () => {
    it('should generate sitemap URLs from database', async () => {
      const baseUrl = 'https://example.com';

      mockPrismaClient.sitemapConfig.findMany.mockResolvedValue([
        { url: '/', changefreq: 'daily', priority: 1.0 },
        { url: '/about', changefreq: 'monthly', priority: 0.8 },
      ] as never);

      mockPrismaClient.blogPost.findMany.mockResolvedValue([
        {
          slug: 'test-post',
          updatedAt: new Date('2025-01-01'),
          publishedAt: new Date('2025-01-01'),
        },
      ] as never);

      mockPrismaClient.category.findMany.mockResolvedValue([
        { slug: 'tech', updatedAt: new Date('2025-01-01') },
      ] as never);

      mockPrismaClient.tag.findMany.mockResolvedValue([
        { slug: 'javascript', updatedAt: new Date('2025-01-01') },
      ] as never);

      const urls = await service.generateSitemapUrls(baseUrl);

      expect(urls.length).toBeGreaterThan(0);
      expect(urls).toContainEqual({
        loc: 'https://example.com/',
        changefreq: 'daily',
        priority: 1.0,
      });
      expect(urls).toContainEqual(
        expect.objectContaining({
          loc: 'https://example.com/blog/test-post',
          changefreq: 'weekly',
          priority: 0.8,
        })
      );
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
  });

  describe('generateRobotsTxt', () => {
    it('should generate valid robots.txt', () => {
      const baseUrl = 'https://example.com';

      const robotsTxt = service.generateRobotsTxt(baseUrl);

      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
      expect(robotsTxt).toContain('Sitemap: https://example.com/sitemap.xml');
      expect(robotsTxt).toContain('Disallow: /admin');
      expect(robotsTxt).toContain('Disallow: /login');
    });
  });
});

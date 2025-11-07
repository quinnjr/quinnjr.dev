import { inject, singleton } from 'tsyringe';
import { DatabaseService } from './database.service';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

/**
 * Service for generating sitemaps
 */
@singleton()
export class SitemapService {
  constructor(
    @inject(DatabaseService) private readonly db: DatabaseService
  ) {}

  private get prisma() {
    return this.db.getClient();
  }

  /**
   * Generate sitemap URLs
   */
  async generateSitemapUrls(baseUrl: string): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = [];

    // Get static routes from SitemapConfig
    const staticRoutes = await this.prisma.sitemapConfig.findMany({
      where: { isStatic: true }
    });

    staticRoutes.forEach((route: { url: string; changefreq: string; priority: number }) => {
      urls.push({
        loc: `${baseUrl}${route.url}`,
        changefreq: route.changefreq,
        priority: route.priority,
      });
    });

    // Get published blog posts
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
      urls.push({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      });
    });

    // Get categories
    const categories = await this.prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    categories.forEach((category: { slug: string; updatedAt: Date }) => {
      urls.push({
        loc: `${baseUrl}/blog/category/${category.slug}`,
        lastmod: category.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.6,
      });
    });

    // Get tags
    const tags = await this.prisma.tag.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    tags.forEach((tag: { slug: string; updatedAt: Date }) => {
      urls.push({
        loc: `${baseUrl}/blog/tag/${tag.slug}`,
        lastmod: tag.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.5,
      });
    });

    return urls;
  }

  /**
   * Generate XML sitemap
   */
  generateSitemapXml(urls: SitemapUrl[]): string {
    const urlEntries = urls.map((url) => {
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
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(baseUrl: string): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin routes
Disallow: /admin
Disallow: /login
Disallow: /callback
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


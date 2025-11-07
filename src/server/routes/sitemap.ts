import { Router } from 'express';
import { container } from 'tsyringe';

import { SitemapService } from '../services/sitemap.service';

const router = Router();
const sitemapService = container.resolve(SitemapService);

/**
 * Generate sitemap.xml with static Angular routes and dynamic blog posts
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const { protocol } = req;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const urls = await sitemapService.generateSitemapUrls(baseUrl);
    const sitemap = sitemapService.generateSitemapXml(urls);

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Generate robots.txt
 */
router.get('/robots.txt', async (req, res) => {
  try {
    const { protocol } = req;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const robotsTxt = sitemapService.generateRobotsTxt(baseUrl);

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
});

export default router;

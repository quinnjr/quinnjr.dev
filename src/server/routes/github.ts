import { Router, type Response } from 'express';

import { container } from '../container';
import { GitHubService } from '../services/github.service';

const router = Router();

/** Matches the service's cache TTL so proxies and browsers stop asking too. */
const CACHE_TEN_MINUTES = 'public, max-age=600';

/**
 * GET /api/github/repositories
 * Fetch all public, non-fork repositories from GitHub
 */
router.get('/repositories', async (_req, res: Response) => {
  try {
    // Resolved per request, not at module load: server.ts imports the routes
    // before initializeContainer() runs, so a module-scope resolve would build
    // its own instance and never see the container singleton's cache.
    const repositories = await container.resolve(GitHubService).getRepositories();
    res.header('Cache-Control', CACHE_TEN_MINUTES);
    res.json({ success: true, data: repositories });
  } catch (error) {
    console.error('Error in /api/github/repositories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories from GitHub',
    });
  }
});

export default router;

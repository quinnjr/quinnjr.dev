import { Router, type Request, type Response } from 'express';

import { container } from '../container';
import { GitHubService } from '../services/github.service';

const router = Router();
const githubService = container.resolve(GitHubService);

/**
 * GET /api/github/repositories
 * Fetch all public, non-fork repositories from GitHub
 */
router.get('/repositories', async (req: Request, res: Response) => {
  try {
    const repositories = await githubService.getRepositories();
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

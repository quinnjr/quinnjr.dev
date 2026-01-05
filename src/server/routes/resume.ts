import { Router, type Request, type Response } from 'express';
import { container } from 'tsyringe';

import { authMiddleware, authErrorHandler, extractUserId } from '../middleware/auth.middleware';
import { ResumeService, type ResumeData } from '../services/resume.service';

const router = Router();
const resumeService = container.resolve(ResumeService);

/**
 * Get the public resume (no auth required)
 */
router.get('/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const resume = await resumeService.getPublicResume();

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    res.json(resume);
  } catch (error) {
    console.error('Error fetching public resume:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

/**
 * Get the user's resume (protected - requires Auth0)
 */
router.get(
  '/',
  authMiddleware,
  extractUserId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth!.userId as string;
      const resume = await resumeService.getResume(userId);

      if (!resume) {
        res.status(404).json({ error: 'Resume not found' });
        return;
      }

      res.json(resume);
    } catch (error) {
      console.error('Error fetching resume:', error);
      res.status(500).json({ error: 'Failed to fetch resume' });
    }
  }
);

/**
 * Create or update resume (protected - requires Auth0)
 */
router.put(
  '/',
  authMiddleware,
  extractUserId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth!.userId as string;

      const resumeData: ResumeData = {
        ...req.body,
        userId,
      };

      const resume = await resumeService.upsertResume(resumeData);
      res.json(resume);
    } catch (error) {
      console.error('Error upserting resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save resume';
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Update partial resume data (protected - requires Auth0)
 */
router.patch(
  '/',
  authMiddleware,
  extractUserId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth!.userId as string;
      const updates: Partial<ResumeData> = req.body;
      const resume = await resumeService.updateResume(userId, updates);

      res.json(resume);
    } catch (error) {
      console.error('Error updating resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update resume';

      if (errorMessage === 'Resume not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Get resume version history (protected - requires Auth0)
 */
router.get(
  '/history',
  authMiddleware,
  extractUserId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth!.userId as string;
      const limit = parseInt(req.query['limit'] as string) || 10;

      const history = await resumeService.getResumeHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error('Error fetching resume history:', error);
      res.status(500).json({ error: 'Failed to fetch resume history' });
    }
  }
);

/**
 * Delete a specific resume version (protected - requires Auth0)
 */
router.delete(
  '/:id',
  authMiddleware,
  extractUserId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth!.userId as string;
      const resumeId = req.params['id'];

      await resumeService.deleteResume(userId, resumeId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting resume:', error);
      res.status(500).json({ error: 'Failed to delete resume' });
    }
  }
);

// Apply auth error handler
router.use(authErrorHandler);

export default router;

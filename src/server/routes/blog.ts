import { Router, type Request } from 'express';
import { container } from 'tsyringe';

import {
  BlogService,
  type CreateBlogPostDto,
  type UpdateBlogPostDto,
} from '../services/blog.service';

const router = Router();
const blogService = container.resolve(BlogService);

/**
 * Get all published blog posts
 */
router.get('/posts', async (req, res): Promise<void> => {
  try {
    const posts = await blogService.getPublishedPosts();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

/**
 * Get a single blog post by slug
 */
router.get('/posts/:slug', async (req, res): Promise<void> => {
  try {
    const { slug } = req.params;
    const post = await blogService.getPostBySlug(slug);

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

/**
 * Create a new blog post (protected - requires Auth0)
 */
router.post('/posts', async (req: Request, res): Promise<void> => {
  try {
    const body = req.body as Partial<CreateBlogPostDto> & {
      publishedAt?: string;
      scheduledFor?: string;
      tags?: string[];
    };

    const post = await blogService.createPost({
      ...body,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      tagIds: body.tags,
    } as CreateBlogPostDto);

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create blog post';
    if (errorMessage === 'A post with this title already exists') {
      res.status(400).json({ error: errorMessage });
      return;
    }
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

/**
 * Update a blog post (protected - requires Auth0)
 */
router.put('/posts/:id', async (req: Request, res): Promise<void> => {
  try {
    const body = req.body as Partial<UpdateBlogPostDto> & {
      publishedAt?: string;
      scheduledFor?: string;
      tags?: string[];
    };

    const post = await blogService.updatePost({
      id: req.params['id'],
      ...body,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      tagIds: body.tags,
    } as UpdateBlogPostDto);

    res.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update blog post';
    if (errorMessage === 'A post with this title already exists') {
      res.status(400).json({ error: errorMessage });
      return;
    }
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

/**
 * Delete a blog post (protected - requires Auth0)
 */
router.delete('/posts/:id', async (req, res): Promise<void> => {
  try {
    await blogService.deletePost(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

/**
 * Get all categories
 */
router.get('/categories', async (req, res): Promise<void> => {
  try {
    const categories = await blogService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * Get all tags
 */
router.get('/tags', async (req, res): Promise<void> => {
  try {
    const tags = await blogService.getTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;

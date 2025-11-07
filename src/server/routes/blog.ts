import { Router } from 'express';
import { container } from 'tsyringe';

import { BlogService } from '../services/blog.service';

const router = Router();
const blogService = container.resolve(BlogService);

/**
 * Get all published blog posts
 */
router.get('/posts', async (req, res) => {
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
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await blogService.getPostBySlug(slug);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
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
router.post('/posts', async (req, res) => {
  try {
    const post = await blogService.createPost({
      ...req.body,
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : undefined,
      scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined,
      tagIds: req.body.tags,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create blog post';
    if (errorMessage === 'A post with this title already exists') {
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

/**
 * Update a blog post (protected - requires Auth0)
 */
router.put('/posts/:id', async (req, res) => {
  try {
    const post = await blogService.updatePost({
      id: req.params.id,
      ...req.body,
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : undefined,
      scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined,
      tagIds: req.body.tags,
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update blog post';
    if (errorMessage === 'A post with this title already exists') {
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

/**
 * Delete a blog post (protected - requires Auth0)
 */
router.delete('/posts/:id', async (req, res) => {
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
router.get('/categories', async (req, res) => {
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
router.get('/tags', async (req, res) => {
  try {
    const tags = await blogService.getTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;

import { vi } from 'vitest';

import { type PostStatus } from '../../../../src/generated/prisma/client';
import { BlogService } from '../../../../src/server/services/blog.service';
import { type DatabaseService } from '../../../../src/server/services/database.service';

import { createMockPrismaClient } from './helpers';

// Mock PrismaClient before importing services
vi.mock('../../../../src/generated/prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

describe('BlogService', () => {
  let service: BlogService;
  let mockDatabaseService: { getClient: ReturnType<typeof vi.fn> };
  let mockPrismaClient: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrismaClient = createMockPrismaClient();

    // Create mock DatabaseService
    mockDatabaseService = {
      getClient: vi.fn().mockReturnValue(mockPrismaClient),
    };

    service = new BlogService(mockDatabaseService as unknown as DatabaseService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPost', () => {
    // A bare `toHaveBeenCalled()` would still pass if createPost were reduced
    // to `this.prisma.blogPost.create({})`, leaving slug generation, the
    // publishedAt hand-off and tag connection entirely unverified. Assert the
    // arguments.
    it('derives the slug from the title and passes the post fields through', async () => {
      const publishedAt = new Date('2024-05-04T00:00:00.000Z');
      const createDto = {
        title: 'Hello, World! (Part 2)',
        content: 'Content here',
        status: 'PUBLISHED' as PostStatus,
        authorId: 'author-1',
        categoryId: 'cat-1',
        publishedAt,
      };

      const mockCreatedPost = { id: '1', ...createDto, slug: 'hello-world-part-2' };

      mockPrismaClient.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.createPost(createDto);

      expect(result).toEqual(mockCreatedPost);
      expect(mockPrismaClient.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Hello, World! (Part 2)',
            slug: 'hello-world-part-2',
            content: 'Content here',
            status: 'PUBLISHED',
            authorId: 'author-1',
            categoryId: 'cat-1',
            publishedAt,
            // Non-nullable columns the DTO omits must get defaults, not undefined.
            seoKeywords: [],
            noIndex: false,
            noFollow: false,
          }),
        })
      );
      // The unique index is the arbiter now — no pre-flight lookup round trip.
      expect(mockPrismaClient.blogPost.findUnique).not.toHaveBeenCalled();
    });

    it('leaves publishedAt unset for a draft', async () => {
      mockPrismaClient.blogPost.create.mockResolvedValue({ id: '1' });

      await service.createPost({
        title: 'A Draft',
        content: 'x',
        status: 'DRAFT',
        authorId: 'author-1',
      });

      const { data } = mockPrismaClient.blogPost.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data['status']).toBe('DRAFT');
      expect(data['publishedAt']).toBeUndefined();
    });

    it('connects the requested tags to the new post', async () => {
      mockPrismaClient.blogPost.create.mockResolvedValue({ id: '1' });

      await service.createPost({
        title: 'Tagged Post',
        content: 'x',
        status: 'DRAFT',
        authorId: 'author-1',
        tagIds: ['tag-1', 'tag-2'],
      });

      const { data } = mockPrismaClient.blogPost.create.mock.calls[0][0] as {
        data: { tags: { create: unknown[] } };
      };
      expect(data.tags.create).toEqual([
        { tag: { connect: { id: 'tag-1' } } },
        { tag: { connect: { id: 'tag-2' } } },
      ]);
    });

    it('should translate the unique-constraint violation into a domain error', async () => {
      const createDto = {
        title: 'Existing Post',
        content: 'Content',
        status: 'DRAFT' as PostStatus,
        authorId: 'author-1',
      };

      mockPrismaClient.blogPost.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
      );

      await expect(service.createPost(createDto)).rejects.toThrow(
        'A post with this title already exists'
      );
    });
  });

  describe('updatePost', () => {
    it('targets the post by id and regenerates the slug from the new title', async () => {
      const updateDto = {
        id: '1',
        title: 'Updated Title',
        content: 'Updated content',
      };

      const mockUpdatedPost = {
        id: '1',
        title: 'Updated Title',
        slug: 'updated-title',
        content: 'Updated content',
      };

      mockPrismaClient.blogPost.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.updatePost(updateDto);

      expect(result).toEqual(mockUpdatedPost);
      expect(mockPrismaClient.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            title: 'Updated Title',
            content: 'Updated content',
            slug: 'updated-title',
          }),
        })
      );
      // The `id` is the where-clause, never part of the update payload.
      const { data } = mockPrismaClient.blogPost.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data).not.toHaveProperty('id');
      // As in createPost, the unique index is the arbiter — no pre-flight
      // conflict lookup round trip.
      expect(mockPrismaClient.blogPost.findFirst).not.toHaveBeenCalled();
    });

    it('does not touch the slug when the title is unchanged', async () => {
      mockPrismaClient.blogPost.update.mockResolvedValue({ id: '1' });

      await service.updatePost({ id: '1', content: 'Only the body changed' });

      // No title → no slug regeneration, and no conflict lookup round trip.
      expect(mockPrismaClient.blogPost.findFirst).not.toHaveBeenCalled();
      const { data } = mockPrismaClient.blogPost.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data).not.toHaveProperty('slug');
      expect(data['content']).toBe('Only the body changed');
    });

    it('should replace tags inside the single update, never deleting them first', async () => {
      mockPrismaClient.blogPost.update.mockResolvedValue({ id: '1' });

      await service.updatePost({ id: '1', tagIds: ['t1', 't2'] });

      // A separate blogPostTag.deleteMany could strand the post with zero tags
      // if the update then failed; the nested deleteMany is part of the same
      // statement.
      const updateArg = mockPrismaClient.blogPost.update.mock.calls[0][0] as {
        data: { tags: { deleteMany: unknown; create: unknown[] } };
      };
      expect(updateArg.data.tags.deleteMany).toEqual({});
      expect(updateArg.data.tags.create).toHaveLength(2);
    });

    it('should translate the unique-constraint violation into a domain error', async () => {
      mockPrismaClient.blogPost.update.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
      );

      await expect(service.updatePost({ id: '1', title: 'Conflicting Title' })).rejects.toThrow(
        'A post with this title already exists'
      );
    });

    it('should let unrelated database errors surface unchanged', async () => {
      mockPrismaClient.blogPost.update.mockRejectedValue(new Error('connection reset'));

      await expect(service.updatePost({ id: '1', title: 'Any Title' })).rejects.toThrow(
        'connection reset'
      );
    });
  });

  describe('deletePost', () => {
    it('should delete a blog post', async () => {
      const postId = '1';

      mockPrismaClient.blogPost.delete.mockResolvedValue({ id: postId });

      const result = await service.deletePost(postId);

      expect(result).toEqual({ id: postId });
      expect(mockPrismaClient.blogPost.delete).toHaveBeenCalledWith({
        where: { id: postId },
      });
    });
  });
});

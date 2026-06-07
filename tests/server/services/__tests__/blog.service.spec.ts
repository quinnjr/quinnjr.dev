import { vi } from 'vitest';
import { PrismaClient } from '../../../../src/generated/prisma/client';
import { BlogService } from '../../../../src/server/services/blog.service';
import { DatabaseService } from '../../../../src/server/services/database.service';
import { PostStatus } from '../../../../src/generated/prisma/client';
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
      getClient: vi.fn().mockReturnValue(mockPrismaClient as unknown as PrismaClient),
    };

    service = new BlogService(mockDatabaseService as unknown as DatabaseService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a new blog post', async () => {
      const createDto = {
        title: 'New Post',
        content: 'Content here',
        status: 'DRAFT' as PostStatus,
        authorId: 'author-1',
      };

      const mockCreatedPost = {
        id: '1',
        ...createDto,
        slug: 'new-post',
      };

      mockPrismaClient.blogPost.findUnique.mockResolvedValue(null);
      mockPrismaClient.blogPost.create.mockResolvedValue(mockCreatedPost);

      const result = await service.createPost(createDto);

      expect(result).toEqual(mockCreatedPost);
      expect(mockPrismaClient.blogPost.create).toHaveBeenCalled();
    });

    it('should throw error if post with same slug exists', async () => {
      const createDto = {
        title: 'Existing Post',
        content: 'Content',
        status: 'DRAFT' as PostStatus,
        authorId: 'author-1',
      };

      mockPrismaClient.blogPost.findUnique.mockResolvedValue({
        id: '1',
        slug: 'existing-post',
      });

      await expect(service.createPost(createDto)).rejects.toThrow(
        'A post with this title already exists'
      );
    });
  });

  describe('updatePost', () => {
    it('should update a blog post', async () => {
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

      mockPrismaClient.blogPost.findFirst.mockResolvedValue(null);
      mockPrismaClient.blogPost.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.updatePost(updateDto);

      expect(result).toEqual(mockUpdatedPost);
      expect(mockPrismaClient.blogPost.update).toHaveBeenCalled();
    });

    it('should throw error if new slug conflicts with another post', async () => {
      const updateDto = {
        id: '1',
        title: 'Conflicting Title',
      };

      mockPrismaClient.blogPost.findFirst.mockResolvedValue({
        id: '2',
        slug: 'conflicting-title',
      });

      await expect(service.updatePost(updateDto)).rejects.toThrow(
        'A post with this title already exists'
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

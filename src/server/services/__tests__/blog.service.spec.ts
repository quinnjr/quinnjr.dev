// Mock PrismaClient before importing services
jest.mock('../../../generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client';
import { BlogService } from '../blog.service';
import { DatabaseService } from '../database.service';
import { PostStatus } from '../../../generated/prisma/client';

describe('BlogService', () => {
  let service: BlogService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockPrismaClient: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    // Create deep mock Prisma client using jest-mock-extended
    mockPrismaClient = mockDeep<PrismaClient>();

    // Create mock DatabaseService
    mockDatabaseService = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
    } as unknown as jest.Mocked<DatabaseService>;

    service = new BlogService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublishedPosts', () => {
    it('should return published posts', async () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post',
          slug: 'test-post',
          status: 'PUBLISHED' as PostStatus,
          publishedAt: new Date(),
        },
      ];

      mockPrismaClient.blogPost.findMany.mockResolvedValue(mockPosts as never);

      const result = await service.getPublishedPosts();

      expect(result).toEqual(mockPosts);
      expect(mockPrismaClient.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          publishedAt: expect.any(Object),
        },
        include: expect.any(Object),
        orderBy: {
          publishedAt: 'desc',
        },
      });
    });
  });

  describe('getPostBySlug', () => {
    it('should return a post by slug and increment view count', async () => {
      const mockPost = {
        id: '1',
        title: 'Test Post',
        slug: 'test-post',
        viewCount: 5,
      };

      mockPrismaClient.blogPost.findUnique.mockResolvedValue(mockPost as never);
      mockPrismaClient.blogPost.update.mockResolvedValue({
        ...mockPost,
        viewCount: 6,
      } as never);

      const result = await service.getPostBySlug('test-post');

      expect(result).toEqual(mockPost);
      expect(mockPrismaClient.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
        include: expect.any(Object),
      });
      expect(mockPrismaClient.blogPost.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    });

    it('should return null if post not found', async () => {
      mockPrismaClient.blogPost.findUnique.mockResolvedValue(null as never);

      const result = await service.getPostBySlug('non-existent');

      expect(result).toBeNull();
      expect(mockPrismaClient.blogPost.update).not.toHaveBeenCalled();
    });
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

      mockPrismaClient.blogPost.findUnique.mockResolvedValue(null as never);
      mockPrismaClient.blogPost.create.mockResolvedValue(mockCreatedPost as never);

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
      } as never);

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

      mockPrismaClient.blogPost.findFirst.mockResolvedValue(null as never);
      mockPrismaClient.blogPost.update.mockResolvedValue(mockUpdatedPost as never);

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
      } as never);

      await expect(service.updatePost(updateDto)).rejects.toThrow(
        'A post with this title already exists'
      );
    });
  });

  describe('deletePost', () => {
    it('should delete a blog post', async () => {
      const postId = '1';

      mockPrismaClient.blogPost.delete.mockResolvedValue({ id: postId } as never);

      const result = await service.deletePost(postId);

      expect(result).toEqual({ id: postId });
      expect(mockPrismaClient.blogPost.delete).toHaveBeenCalledWith({
        where: { id: postId },
      });
    });
  });

  describe('getCategories', () => {
    it('should return all categories with post counts', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Tech',
          slug: 'tech',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { blogPosts: 5 }
        },
        {
          id: '2',
          name: 'News',
          slug: 'news',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { blogPosts: 3 }
        },
      ] as never;

      mockPrismaClient.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(result).toEqual(mockCategories);
      expect(mockPrismaClient.category.findMany).toHaveBeenCalled();
    });
  });

  describe('getTags', () => {
    it('should return all tags with post counts', async () => {
      const mockTags = [
        {
          id: '1',
          name: 'JavaScript',
          slug: 'javascript',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { blogPosts: 10 }
        },
        {
          id: '2',
          name: 'TypeScript',
          slug: 'typescript',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { blogPosts: 8 }
        },
      ] as never;

      mockPrismaClient.tag.findMany.mockResolvedValue(mockTags);

      const result = await service.getTags();

      expect(result).toEqual(mockTags);
      expect(mockPrismaClient.tag.findMany).toHaveBeenCalled();
    });
  });
});


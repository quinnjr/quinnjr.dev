import slugify from 'slugify';
import { inject, singleton } from 'tsyringe';

import { PostStatus, Prisma } from '../../generated/prisma/client';

import { DatabaseService } from './database.service';

export interface CreateBlogPostDto {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: PostStatus;
  publishedAt?: Date;
  scheduledFor?: Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  authorId: string;
  categoryId?: string;
  tagIds?: string[];
}

export interface UpdateBlogPostDto extends Partial<CreateBlogPostDto> {
  id: string;
}

/**
 * Service for managing blog posts
 */
@singleton()
export class BlogService {
  constructor(@inject(DatabaseService) private readonly db: DatabaseService) {}

  private get prisma() {
    return this.db.getClient();
  }

  /**
   * Create a new blog post
   */
  async createPost(data: CreateBlogPostDto) {
    const slug = this.generateSlug(data.title);

    // Check if slug already exists
    const existingPost = await this.prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingPost) {
      throw new Error('A post with this title already exists');
    }

    return this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        status: data.status,
        publishedAt: data.publishedAt,
        scheduledFor: data.scheduledFor,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords ?? [],
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImage: data.ogImage,
        canonicalUrl: data.canonicalUrl,
        noIndex: data.noIndex ?? false,
        noFollow: data.noFollow ?? false,
        authorId: data.authorId,
        categoryId: data.categoryId,
        tags: {
          create:
            data.tagIds?.map(tagId => ({
              tag: {
                connect: { id: tagId },
              },
            })) ?? [],
        },
      },
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * Update a blog post
   */
  async updatePost(data: UpdateBlogPostDto) {
    const { id, tagIds, ...updateData } = data;

    // If title changed, regenerate slug
    let slug: string | undefined;
    if (updateData.title) {
      slug = this.generateSlug(updateData.title);

      // Check if new slug conflicts with another post
      const existingPost = await this.prisma.blogPost.findFirst({
        where: {
          slug,
          NOT: {
            id,
          },
        },
      });

      if (existingPost) {
        throw new Error('A post with this title already exists');
      }
    }

    // Delete existing tags if updating
    if (tagIds) {
      await this.prisma.blogPostTag.deleteMany({
        where: { blogPostId: id },
      });
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...updateData,
        ...(slug && { slug }),
        ...(tagIds && {
          tags: {
            create: tagIds.map(tagId => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          },
        }),
      },
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * Delete a blog post
   */
  deletePost(id: string): Promise<unknown> {
    return this.prisma.blogPost.delete({
      where: { id },
    });
  }

  createCategory(data: { name: string; slug?: string; description?: string }) {
    return this.prisma.category.create({
      data: { name: data.name, slug: data.slug ?? this.generateSlug(data.name), description: data.description },
    });
  }

  updateCategory(id: string, data: { name?: string; description?: string }) {
    return this.prisma.category.update({
      where: { id },
      data: { ...data, ...(data.name ? { slug: this.generateSlug(data.name) } : {}) },
    });
  }

  deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  createTag(name: string) {
    return this.prisma.tag.create({ data: { name, slug: this.generateSlug(name) } });
  }

  deleteTag(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }

  updateSeoSettings(data: Prisma.SeoSettingsUpdateInput) {
    return this.prisma.seoSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', siteName: 'quinnjr.dev', ...(data as Prisma.SeoSettingsCreateInput) },
    });
  }

  /**
   * Generate a URL-friendly slug from a title
   */
  private generateSlug(title: string): string {
    return slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
}

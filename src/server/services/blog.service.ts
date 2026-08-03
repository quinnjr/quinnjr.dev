import slugify from 'slugify';
import { inject, singleton } from 'tsyringe';

import { PostStatus, Prisma } from '../../generated/prisma/client';
import { UserInputError } from '../graphql/errors';

import { DatabaseService } from './database.service';

const DUPLICATE_TITLE_MESSAGE = 'A post with this title already exists';

/**
 * Duck-typed rather than `instanceof Prisma.PrismaClientKnownRequestError`:
 * specs mock the generated client module out, so the class is not available.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'
  );
}

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

    // No pre-flight uniqueness check: it cost an extra round trip on every
    // successful create and still lost the race between two concurrent creates
    // of the same title. The unique index on `slug` is the real arbiter, so let
    // it decide and translate its P2002 into the same domain error.
    try {
      return await this.createPostRecord(data, slug);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UserInputError(DUPLICATE_TITLE_MESSAGE);
      }
      throw error;
    }
  }

  private createPostRecord(data: CreateBlogPostDto, slug: string) {
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
        throw new UserInputError(DUPLICATE_TITLE_MESSAGE);
      }
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...updateData,
        ...(slug && { slug }),
        // Tag replacement is nested in the same update so it is one statement:
        // deleting the old rows first left the post with zero tags whenever the
        // update then failed (slug race, bad tagId, dropped connection).
        ...(tagIds && {
          tags: {
            deleteMany: {},
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
      data: {
        name: data.name,
        slug: data.slug ?? this.generateSlug(data.name),
        description: data.description,
      },
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
      create: {
        id: 'default',
        siteName: 'quinnjr.dev',
        ...(data as Prisma.SeoSettingsCreateInput),
      },
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

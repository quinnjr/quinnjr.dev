// src/server/graphql/resolvers/blog.mutations.ts
import { type CreateBlogPostDto, type UpdateBlogPostDto } from '../../services/blog.service';
import { builder } from '../builder';
import { meetsMinimumRole, requireUser } from '../context';
import { rethrowAsGraphQLError } from '../errors';
import { PostStatus } from '../types';

import { blog } from './services';

const CreateBlogPostInput = builder.inputType('CreateBlogPostInput', {
  fields: t => ({
    title: t.string({ required: true }),
    content: t.string({ required: true }),
    excerpt: t.string(),
    featuredImage: t.string(),
    status: t.field({ type: PostStatus, required: true }),
    publishedAt: t.field({ type: 'DateTime' }),
    scheduledFor: t.field({ type: 'DateTime' }),
    seoTitle: t.string(),
    seoDescription: t.string(),
    seoKeywords: t.stringList(),
    ogTitle: t.string(),
    ogDescription: t.string(),
    ogImage: t.string(),
    canonicalUrl: t.string(),
    noIndex: t.boolean(),
    noFollow: t.boolean(),
    categoryId: t.string(),
    tagIds: t.stringList(),
  }),
});

const UpdateBlogPostInput = builder.inputType('UpdateBlogPostInput', {
  fields: t => ({
    title: t.string(),
    content: t.string(),
    excerpt: t.string(),
    featuredImage: t.string(),
    status: t.field({ type: PostStatus }),
    publishedAt: t.field({ type: 'DateTime' }),
    scheduledFor: t.field({ type: 'DateTime' }),
    seoTitle: t.string(),
    seoDescription: t.string(),
    seoKeywords: t.stringList(),
    ogTitle: t.string(),
    ogDescription: t.string(),
    ogImage: t.string(),
    canonicalUrl: t.string(),
    noIndex: t.boolean(),
    noFollow: t.boolean(),
    categoryId: t.string(),
    tagIds: t.stringList(),
  }),
});

builder.mutationType({
  fields: t => ({
    createPost: t.prismaField({
      type: 'BlogPost',
      authScopes: { role: 'AUTHOR' },
      args: { input: t.arg({ type: CreateBlogPostInput, required: true }) },
      resolve: async (_query, _root, args, ctx) => {
        try {
          return await blog().createPost({
            ...args.input,
            seoKeywords: args.input.seoKeywords ?? undefined,
            tagIds: args.input.tagIds ?? undefined,
            authorId: requireUser(ctx).id,
          } as CreateBlogPostDto);
        } catch (e) {
          rethrowAsGraphQLError(e);
        }
      },
    }),

    updatePost: t.prismaField({
      type: 'BlogPost',
      authScopes: { role: 'AUTHOR' },
      args: {
        id: t.arg.string({ required: true }),
        input: t.arg({ type: UpdateBlogPostInput, required: true }),
      },
      resolve: async (_query, _root, args, ctx) => {
        const existing = await ctx.prisma.blogPost.findUnique({
          where: { id: args.id },
          select: { authorId: true },
        });
        if (!existing) {
          rethrowAsGraphQLError(new Error('Post not found'));
        }
        // Authors may only edit their own posts; editors and above may edit any.
        if (!meetsMinimumRole(ctx.user, 'EDITOR') && existing.authorId !== requireUser(ctx).id) {
          rethrowAsGraphQLError(new Error('You can only edit your own posts'));
        }
        try {
          return await blog().updatePost({
            id: args.id,
            ...args.input,
            seoKeywords: args.input.seoKeywords ?? undefined,
            tagIds: args.input.tagIds ?? undefined,
          } as UpdateBlogPostDto);
        } catch (e) {
          rethrowAsGraphQLError(e);
        }
      },
    }),

    deletePost: t.field({
      type: 'Boolean',
      authScopes: { role: 'EDITOR' },
      args: { id: t.arg.string({ required: true }) },
      resolve: async (_root, args) => {
        await blog().deletePost(args.id);
        return true;
      },
    }),

    recordPostView: t.field({
      type: 'Boolean',
      authScopes: { public: true },
      args: { slug: t.arg.string({ required: true }) },
      resolve: async (_root, args, ctx) => {
        await ctx.prisma.blogPost.updateMany({
          where: { slug: args.slug, status: 'PUBLISHED' },
          data: { viewCount: { increment: 1 } },
        });
        return true;
      },
    }),
  }),
});

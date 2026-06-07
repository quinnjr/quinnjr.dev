// src/server/graphql/resolvers/blog.queries.ts
import { builder } from '../builder';
import { meetsMinimumRole } from '../context';
import { PostStatus } from '../types';

builder.queryType({
  fields: (t) => ({
    publishedPosts: t.prismaField({
      type: ['BlogPost'],
      authScopes: { public: true },
      args: {
        categorySlug: t.arg.string({ required: false }),
        tagSlug: t.arg.string({ required: false }),
      },
      resolve: (query, _root, args, ctx) =>
        ctx.prisma.blogPost.findMany({
          ...query,
          where: {
            status: 'PUBLISHED',
            publishedAt: { lte: new Date() },
            ...(args.categorySlug ? { category: { slug: args.categorySlug } } : {}),
            ...(args.tagSlug ? { tags: { some: { tag: { slug: args.tagSlug } } } } : {}),
          },
          orderBy: { publishedAt: 'desc' },
        }),
    }),

    post: t.prismaField({
      type: 'BlogPost',
      nullable: true,
      authScopes: { public: true },
      args: { slug: t.arg.string({ required: true }) },
      resolve: async (query, _root, args, ctx) => {
        const post = await ctx.prisma.blogPost.findUnique({
          ...query,
          where: { slug: args.slug },
        });
        if (!post) return null;
        // Non-published posts are visible only to editors and above.
        if (post.status !== 'PUBLISHED' && !meetsMinimumRole(ctx.user, 'EDITOR')) {
          return null;
        }
        return post;
      },
    }),

    posts: t.prismaField({
      type: ['BlogPost'],
      authScopes: { role: 'EDITOR' },
      args: { status: t.arg({ type: PostStatus, required: false }) },
      resolve: (query, _root, args, ctx) =>
        ctx.prisma.blogPost.findMany({
          ...query,
          where: args.status ? { status: args.status } : {},
          orderBy: { updatedAt: 'desc' },
        }),
    }),

    categories: t.prismaField({
      type: ['Category'],
      authScopes: { public: true },
      resolve: (query, _root, _args, ctx) =>
        ctx.prisma.category.findMany({ ...query, orderBy: { name: 'asc' } }),
    }),

    tags: t.prismaField({
      type: ['Tag'],
      authScopes: { public: true },
      resolve: (query, _root, _args, ctx) =>
        ctx.prisma.tag.findMany({ ...query, orderBy: { name: 'asc' } }),
    }),

    seoSettings: t.prismaField({
      type: 'SeoSettings',
      nullable: true,
      authScopes: { public: true },
      resolve: (query, _root, _args, ctx) =>
        ctx.prisma.seoSettings.findFirst({ ...query }),
    }),
  }),
});

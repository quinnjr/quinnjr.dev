// src/server/graphql/resolvers/taxonomy.mutations.ts
import { container } from 'tsyringe';
import { builder } from '../builder';
import '../types';
import { BlogService } from '../../services/blog.service';
import { Prisma } from '../../../generated/prisma/client';
import { rethrowAsGraphQLError } from '../errors';

const blog = () => container.resolve(BlogService);

builder.mutationFields((t) => ({
  createCategory: t.prismaField({
    type: 'Category',
    authScopes: { role: 'EDITOR' },
    args: { name: t.arg.string({ required: true }), description: t.arg.string() },
    resolve: (_query, _root, args) =>
      blog().createCategory({ name: args.name, description: args.description ?? undefined }),
  }),
  updateCategory: t.prismaField({
    type: 'Category',
    authScopes: { role: 'EDITOR' },
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      description: t.arg.string(),
    },
    resolve: (_query, _root, args) =>
      blog().updateCategory(args.id, {
        name: args.name ?? undefined,
        description: args.description ?? undefined,
      }),
  }),
  deleteCategory: t.field({
    type: 'Boolean',
    authScopes: { role: 'ADMIN' },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      await blog().deleteCategory(args.id);
      return true;
    },
  }),
  createTag: t.prismaField({
    type: 'Tag',
    authScopes: { role: 'AUTHOR' },
    args: { name: t.arg.string({ required: true }) },
    resolve: (_query, _root, args) => blog().createTag(args.name),
  }),
  deleteTag: t.field({
    type: 'Boolean',
    authScopes: { role: 'EDITOR' },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      await blog().deleteTag(args.id);
      return true;
    },
  }),
  updateSeoSettings: t.prismaField({
    type: 'SeoSettings',
    authScopes: { role: 'ADMIN' },
    args: {
      siteName: t.arg.string(),
      siteDescription: t.arg.string(),
      twitterHandle: t.arg.string(),
      defaultOgImage: t.arg.string(),
    },
    resolve: async (_query, _root, args) => {
      const data = Object.fromEntries(
        Object.entries(args).filter(([, v]) => v != null),
      ) as Prisma.SeoSettingsUpdateInput;
      try {
        return await blog().updateSeoSettings(data);
      } catch (e) {
        rethrowAsGraphQLError(e);
      }
    },
  }),
}));

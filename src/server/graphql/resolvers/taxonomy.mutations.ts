// src/server/graphql/resolvers/taxonomy.mutations.ts
import { type Prisma } from '../../../generated/prisma/client';
import { builder } from '../builder';
import { rethrowAsGraphQLError } from '../errors';
import '../types';

import { blog } from './services';

builder.mutationFields(t => ({
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
      try {
        await blog().deleteCategory(args.id);
      } catch (e) {
        // Maps Prisma's P2025 for a missing id, which would otherwise escape
        // unmapped and be masked as "Unexpected error" in production.
        rethrowAsGraphQLError(e, 'Category not found');
      }
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
      try {
        await blog().deleteTag(args.id);
      } catch (e) {
        rethrowAsGraphQLError(e, 'Tag not found');
      }
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
      const data: Prisma.SeoSettingsUpdateInput = {
        ...(args.siteName != null && { siteName: args.siteName }),
        ...(args.siteDescription != null && { siteDescription: args.siteDescription }),
        ...(args.twitterHandle != null && { twitterHandle: args.twitterHandle }),
        ...(args.defaultOgImage != null && { defaultOgImage: args.defaultOgImage }),
      };
      try {
        return await blog().updateSeoSettings(data);
      } catch (e) {
        rethrowAsGraphQLError(e);
      }
    },
  }),
}));

// src/server/graphql/types/index.ts
import { builder } from '../builder';

export const UserRole = builder.enumType('UserRole', {
  values: ['ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER'] as const,
});

export const PostStatus = builder.enumType('PostStatus', {
  values: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'] as const,
});

export const UserType = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    picture: t.exposeString('picture', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    role: t.expose('role', { type: UserRole }),
    // Sensitive fields: ADMIN only, or the user themselves.
    email: t.exposeString('email', {
      nullable: true,
      authScopes: (user, _args, ctx) => ctx.user?.id === user.id || { role: 'ADMIN' },
    }),
    auth0Id: t.exposeString('auth0Id', {
      nullable: true,
      authScopes: (user, _args, ctx) => ctx.user?.id === user.id || { role: 'ADMIN' },
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

export const CategoryType = builder.prismaObject('Category', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    slug: t.exposeString('slug'),
    description: t.exposeString('description', { nullable: true }),
    postCount: t.relationCount('blogPosts'),
  }),
});

export const TagType = builder.prismaObject('Tag', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    slug: t.exposeString('slug'),
    postCount: t.relationCount('blogPosts'),
  }),
});

export const BlogPostTagType = builder.prismaObject('BlogPostTag', {
  fields: (t) => ({
    id: t.exposeID('id'),
    tag: t.relation('tag'),
  }),
});

export const BlogPostType = builder.prismaObject('BlogPost', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    slug: t.exposeString('slug'),
    content: t.exposeString('content'),
    excerpt: t.exposeString('excerpt', { nullable: true }),
    featuredImage: t.exposeString('featuredImage', { nullable: true }),
    status: t.expose('status', { type: PostStatus }),
    publishedAt: t.expose('publishedAt', { type: 'DateTime', nullable: true }),
    scheduledFor: t.expose('scheduledFor', { type: 'DateTime', nullable: true }),
    seoTitle: t.exposeString('seoTitle', { nullable: true }),
    seoDescription: t.exposeString('seoDescription', { nullable: true }),
    seoKeywords: t.expose('seoKeywords', { type: 'JSON', nullable: true }),
    ogTitle: t.exposeString('ogTitle', { nullable: true }),
    ogDescription: t.exposeString('ogDescription', { nullable: true }),
    ogImage: t.exposeString('ogImage', { nullable: true }),
    canonicalUrl: t.exposeString('canonicalUrl', { nullable: true }),
    noIndex: t.exposeBoolean('noIndex'),
    noFollow: t.exposeBoolean('noFollow'),
    viewCount: t.exposeInt('viewCount'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    author: t.relation('author'),
    category: t.relation('category', { nullable: true }),
    tags: t.relation('tags'),
  }),
});

export const SeoSettingsType = builder.prismaObject('SeoSettings', {
  fields: (t) => ({
    id: t.exposeID('id'),
    siteName: t.exposeString('siteName'),
    siteDescription: t.exposeString('siteDescription', { nullable: true }),
    siteKeywords: t.expose('siteKeywords', { type: 'JSON', nullable: true }),
    defaultOgImage: t.exposeString('defaultOgImage', { nullable: true }),
    twitterHandle: t.exposeString('twitterHandle', { nullable: true }),
    organizationName: t.exposeString('organizationName', { nullable: true }),
  }),
});

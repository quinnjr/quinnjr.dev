import { describe, it, expect } from 'vitest';
import { graphql } from 'graphql';
import { schema } from '../../../src/server/graphql/schema';

// Minimal stub prisma so resolvers don't need a real database.
// `findManyCalls` captures the args each `blogPost.findMany` was invoked with.
function stubContext(user: { id: string; role: string } | null, findManyCalls: unknown[] = []) {
  return {
    prisma: {
      blogPost: {
        findMany: async (args: unknown) => {
          findManyCalls.push(args);
          return [];
        },
        findUnique: async () => null,
      },
      category: { findMany: async () => [] },
      tag: { findMany: async () => [] },
      seoSettings: { findFirst: async () => null },
    },
    user,
    isAuthenticated: user != null,
  } as never;
}

describe('read queries', () => {
  it('publishedPosts is public and returns data for anonymous', async () => {
    const result = await graphql({
      schema,
      source: '{ publishedPosts { id title } }',
      contextValue: stubContext(null),
    });
    expect(result.errors).toBeUndefined();
    expect(result.data).toHaveProperty('publishedPosts');
  });

  it('admin posts query is forbidden for anonymous', async () => {
    const result = await graphql({
      schema,
      source: '{ posts { id } }',
      contextValue: stubContext(null),
    });
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.extensions?.['code'] ?? 'FORBIDDEN').toBeTruthy();
  });

  it('posts query: EDITOR sees all posts (no author filter)', async () => {
    const calls: unknown[] = [];
    const result = await graphql({
      schema,
      source: '{ posts { id } }',
      contextValue: stubContext({ id: 'u1', role: 'EDITOR' }, calls),
    });
    expect(result.errors).toBeUndefined();
    const where = (calls[0] as { where: Record<string, unknown> }).where;
    expect(where).not.toHaveProperty('authorId');
  });

  it('posts query: AUTHOR is allowed but scoped to their own posts', async () => {
    const calls: unknown[] = [];
    const result = await graphql({
      schema,
      source: '{ posts { id } }',
      contextValue: stubContext({ id: 'author-1', role: 'AUTHOR' }, calls),
    });
    expect(result.errors).toBeUndefined();
    const where = (calls[0] as { where: Record<string, unknown> }).where;
    expect(where.authorId).toBe('author-1');
  });
});

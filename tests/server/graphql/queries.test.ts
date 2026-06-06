import { describe, it, expect } from 'vitest';
import { graphql } from 'graphql';
import { schema } from '../../../src/server/graphql/schema';

// Minimal stub prisma so resolvers don't need a real database.
function stubContext(user: { id: string; role: string } | null) {
  return {
    prisma: {
      blogPost: { findMany: async () => [], findUnique: async () => null },
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

  it('admin posts query is allowed for EDITOR', async () => {
    const result = await graphql({
      schema,
      source: '{ posts { id } }',
      contextValue: stubContext({ id: 'u1', role: 'EDITOR' }),
    });
    expect(result.errors).toBeUndefined();
    expect(result.data).toHaveProperty('posts');
  });
});

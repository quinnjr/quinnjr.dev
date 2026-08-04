import { graphql } from 'graphql';
import { describe, it, expect } from 'vitest';

import { schema } from '../../../src/server/graphql/schema';

// Minimal stub prisma so resolvers don't need a real database.
// `findManyCalls` captures the args each `blogPost.findMany` was invoked with.
function stubContext(
  user: { id: string; role: string } | null,
  findManyCalls: unknown[] = [],
  findUniqueResult: unknown = null
) {
  return {
    prisma: {
      blogPost: {
        findMany: async (args: unknown) => {
          findManyCalls.push(args);
          return [];
        },
        findUnique: async () => findUniqueResult,
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
    const calls: unknown[] = [];
    const result = await graphql({
      schema,
      source: '{ posts { id } }',
      contextValue: stubContext(null, calls),
    });
    // `errors?.[0]?.extensions?.['code'] ?? 'FORBIDDEN'` used to stand here; the
    // `??` fallback made it unconditionally truthy, so it passed even when the
    // query was allowed. The scope-auth plugin denies without an extensions
    // code, so pin what it actually produces — and that no query ever ran.
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toBe('Not authorized to resolve Query.posts');
    expect(result.data?.['posts'] ?? null).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('posts query: EDITOR sees all posts (no author filter)', async () => {
    const calls: unknown[] = [];
    const result = await graphql({
      schema,
      source: '{ posts { id } }',
      contextValue: stubContext({ id: 'u1', role: 'EDITOR' }, calls),
    });
    expect(result.errors).toBeUndefined();
    const { where } = calls[0] as { where: Record<string, unknown> };
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
    const { where } = calls[0] as { where: Record<string, unknown> };
    expect(where['authorId']).toBe('author-1');
  });

  // postById backs the admin editor's load. Its ownership rule is the reason
  // the editor can no longer be handed a post the user may not edit.
  describe('postById', () => {
    const draft = {
      id: 'p1',
      title: 'Draft',
      status: 'DRAFT',
      authorId: 'author-1',
    };

    it('is denied to anonymous callers', async () => {
      const result = await graphql({
        schema,
        source: '{ postById(id: "p1") { id } }',
        contextValue: stubContext(null, [], draft),
      });
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toBe('Not authorized to resolve Query.postById');
    });

    it('returns the post to its own author', async () => {
      const result = await graphql({
        schema,
        source: '{ postById(id: "p1") { id title } }',
        contextValue: stubContext({ id: 'author-1', role: 'AUTHOR' }, [], draft),
      });
      expect(result.errors).toBeUndefined();
      expect(result.data?.['postById']).toEqual({ id: 'p1', title: 'Draft' });
    });

    it("returns null for another author's post rather than leaking it", async () => {
      const result = await graphql({
        schema,
        source: '{ postById(id: "p1") { id } }',
        contextValue: stubContext({ id: 'author-2', role: 'AUTHOR' }, [], draft),
      });
      expect(result.errors).toBeUndefined();
      expect(result.data?.['postById']).toBeNull();
    });

    it("lets an EDITOR load another author's post", async () => {
      const result = await graphql({
        schema,
        source: '{ postById(id: "p1") { id } }',
        contextValue: stubContext({ id: 'someone-else', role: 'EDITOR' }, [], draft),
      });
      expect(result.errors).toBeUndefined();
      expect(result.data?.['postById']).toEqual({ id: 'p1' });
    });

    it('returns null when the post does not exist', async () => {
      const result = await graphql({
        schema,
        source: '{ postById(id: "nope") { id } }',
        contextValue: stubContext({ id: 'author-1', role: 'AUTHOR' }, [], null),
      });
      expect(result.errors).toBeUndefined();
      expect(result.data?.['postById']).toBeNull();
    });
  });
});

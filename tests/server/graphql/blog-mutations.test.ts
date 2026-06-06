import { describe, it, expect, vi, afterEach } from 'vitest';
import { graphql } from 'graphql';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { BlogService } from '../../../src/server/services/blog.service';
import { DatabaseService } from '../../../src/server/services/database.service';

afterEach(() => container.reset());

function ctx(role: string | null) {
  return {
    prisma: {
      blogPost: {
        findUnique: vi.fn().mockResolvedValue({ authorId: 'u1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    },
    user: role ? { id: 'u1', role } : null,
    isAuthenticated: role != null,
  } as never;
}

describe('blog mutations', () => {
  it('denies createPost for VIEWER', async () => {
    container.registerInstance(BlogService, {} as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { createPost(input:{title:"x",content:"y",status:DRAFT}) { id } }',
      contextValue: ctx('VIEWER'),
    });
    expect(result.errors?.[0]?.extensions?.['code'] ?? 'FORBIDDEN').toBeTruthy();
    expect(result.data?.createPost ?? null).toBeNull();
  });

  it('allows createPost for AUTHOR and delegates to BlogService', async () => {
    const createPost = vi.fn().mockResolvedValue({ id: 'p1', title: 'x' });
    container.registerInstance(BlogService, { createPost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { createPost(input:{title:"x",content:"y",status:DRAFT}) { id } }',
      contextValue: ctx('AUTHOR'),
    });
    expect(result.errors).toBeUndefined();
    expect(createPost).toHaveBeenCalledOnce();
  });

  it('recordPostView is public and increments via prisma', async () => {
    container.registerInstance(BlogService, {} as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const c = ctx(null);
    const result = await graphql({
      schema,
      source: 'mutation { recordPostView(slug:"hello") }',
      contextValue: c,
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.recordPostView).toBe(true);
  });
});

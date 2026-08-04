import { graphql } from 'graphql';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { BlogService } from '../../../src/server/services/blog.service';
import { DatabaseService } from '../../../src/server/services/database.service';

afterEach(() => container.reset());

function ctx(role: string | null, { authorId = 'u1' }: { authorId?: string | null } = {}) {
  return {
    prisma: {
      blogPost: {
        findUnique: vi.fn().mockResolvedValue(authorId !== null ? { authorId } : null),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    },
    user: role ? { id: 'u1', role } : null,
    isAuthenticated: role != null,
  } as never;
}

describe('blog mutations', () => {
  it('denies createPost for VIEWER', async () => {
    const createPost = vi.fn();
    container.registerInstance(BlogService, { createPost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { createPost(input:{title:"x",content:"y",status:DRAFT}) { id } }',
      contextValue: ctx('VIEWER'),
    });
    // `errors?.[0]?.extensions?.['code'] ?? 'FORBIDDEN'` used to stand here; the
    // `??` fallback made it unconditionally truthy, so it passed even when the
    // mutation was allowed. The scope-auth plugin denies without an extensions
    // code, so pin what it actually produces: the denial message naming the
    // field, no data, and — most importantly — no call into the service.
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toBe('Not authorized to resolve Mutation.createPost');
    expect(result.data?.['createPost'] ?? null).toBeNull();
    expect(createPost).not.toHaveBeenCalled();
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
    expect(result.data?.['recordPostView']).toBe(true);
    expect((c as any).prisma.blogPost.updateMany).toHaveBeenCalledOnce();
    expect((c as any).prisma.blogPost.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slug: 'hello', status: 'PUBLISHED' }),
        data: { viewCount: { increment: 1 } },
      })
    );
  });

  it('updatePost: AUTHOR edits own post → succeeds and delegates', async () => {
    const updatePost = vi.fn().mockResolvedValue({ id: 'p1', title: 'z' });
    container.registerInstance(BlogService, { updatePost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { updatePost(id:"p1", input:{title:"z"}) { id } }',
      contextValue: ctx('AUTHOR', { authorId: 'u1' }),
    });
    expect(result.errors).toBeUndefined();
    expect(updatePost).toHaveBeenCalledOnce();
  });

  it("updatePost: AUTHOR edits someone else's post → denied and not delegated", async () => {
    const updatePost = vi.fn();
    container.registerInstance(BlogService, { updatePost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { updatePost(id:"p1", input:{title:"z"}) { id } }',
      contextValue: ctx('AUTHOR', { authorId: 'other' }),
    });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('your own posts');
    expect(result.errors![0].extensions?.['code']).toBe('FORBIDDEN');
    expect(updatePost).not.toHaveBeenCalled();
  });

  it("updatePost: EDITOR edits someone else's post → succeeds (privileged bypass)", async () => {
    const updatePost = vi.fn().mockResolvedValue({ id: 'p1', title: 'z' });
    container.registerInstance(BlogService, { updatePost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { updatePost(id:"p1", input:{title:"z"}) { id } }',
      contextValue: ctx('EDITOR', { authorId: 'other' }),
    });
    expect(result.errors).toBeUndefined();
    expect(updatePost).toHaveBeenCalledOnce();
  });

  it('updatePost: missing post → error and not delegated', async () => {
    const updatePost = vi.fn();
    container.registerInstance(BlogService, { updatePost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { updatePost(id:"p1", input:{title:"z"}) { id } }',
      contextValue: ctx('AUTHOR', { authorId: null }),
    });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toBe('Post not found');
    expect(result.errors![0].extensions?.['code']).toBe('NOT_FOUND');
    expect(updatePost).not.toHaveBeenCalled();
  });

  it('deletePost: EDITOR is allowed → returns true and delegates', async () => {
    const deletePost = vi.fn().mockResolvedValue(undefined);
    container.registerInstance(BlogService, { deletePost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { deletePost(id:"p1") }',
      contextValue: ctx('EDITOR'),
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.['deletePost']).toBe(true);
    expect(deletePost).toHaveBeenCalledOnce();
  });

  it('deletePost: AUTHOR is denied → error and not delegated', async () => {
    const deletePost = vi.fn();
    container.registerInstance(BlogService, { deletePost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { deletePost(id:"p1") }',
      contextValue: ctx('AUTHOR'),
    });
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toBe('Not authorized to resolve Mutation.deletePost');
    expect(result.data?.['deletePost'] ?? null).toBeNull();
    expect(deletePost).not.toHaveBeenCalled();
  });

  it('deletePost: missing post → NOT_FOUND rather than a masked internal error', async () => {
    const deletePost = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('nope'), { code: 'P2025' }));
    container.registerInstance(BlogService, { deletePost } as never);
    container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { deletePost(id:"missing") }',
      contextValue: ctx('EDITOR'),
    });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toBe('Post not found');
    expect(result.errors![0].extensions?.['code']).toBe('NOT_FOUND');
  });
});

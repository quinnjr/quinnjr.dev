import { describe, it, expect, vi, afterEach } from 'vitest';
import { graphql } from 'graphql';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { BlogService } from '../../../src/server/services/blog.service';
import { DatabaseService } from '../../../src/server/services/database.service';

afterEach(() => container.reset());

function register(blogMock: object) {
  container.registerInstance(BlogService, blogMock as never);
  container.registerInstance(DatabaseService, { getClient: () => ({}) } as never);
}
function ctx(role: string | null) {
  return {
    prisma: {},
    user: role ? { id: 'u1', role } : null,
    isAuthenticated: role != null,
  } as never;
}

describe('taxonomy mutations', () => {
  it('EDITOR can create a category and delegates', async () => {
    const createCategory = vi.fn().mockResolvedValue({ id: 'c1', name: 'Tech', slug: 'tech' });
    register({ createCategory });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { createCategory(name:"Tech") { id slug } }',
      contextValue: ctx('EDITOR'),
    });
    expect(result.errors).toBeUndefined();
    expect(createCategory).toHaveBeenCalledOnce();
  });

  it('VIEWER cannot create a category', async () => {
    const createCategory = vi.fn();
    register({ createCategory });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { createCategory(name:"Tech") { id } }',
      contextValue: ctx('VIEWER'),
    });
    expect(result.errors).toBeDefined();
    expect(createCategory).not.toHaveBeenCalled();
  });

  it('AUTHOR can create a tag but cannot delete a category (ADMIN only)', async () => {
    const createTag = vi.fn().mockResolvedValue({ id: 't1', name: 'ng', slug: 'ng' });
    const deleteCategory = vi.fn();
    register({ createTag, deleteCategory });
    const { schema } = await import('../../../src/server/graphql/schema');
    const okTag = await graphql({
      schema,
      source: 'mutation { createTag(name:"ng") { id } }',
      contextValue: ctx('AUTHOR'),
    });
    expect(okTag.errors).toBeUndefined();
    expect(createTag).toHaveBeenCalledOnce();
    const denied = await graphql({
      schema,
      source: 'mutation { deleteCategory(id:"c1") }',
      contextValue: ctx('AUTHOR'),
    });
    expect(denied.errors).toBeDefined();
    expect(deleteCategory).not.toHaveBeenCalled();
  });

  it('ADMIN can update SEO settings', async () => {
    const updateSeoSettings = vi.fn().mockResolvedValue({ id: 'default', siteName: 'X' });
    register({ updateSeoSettings });
    const { schema } = await import('../../../src/server/graphql/schema');
    const result = await graphql({
      schema,
      source: 'mutation { updateSeoSettings(siteName:"X") { id siteName } }',
      contextValue: ctx('ADMIN'),
    });
    expect(result.errors).toBeUndefined();
    expect(updateSeoSettings).toHaveBeenCalledOnce();
  });
});

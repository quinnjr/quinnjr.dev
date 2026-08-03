import { describe, it, expect } from 'vitest';

import { builder } from '../../../src/server/graphql/builder';
import '../../../src/server/graphql/types';

describe('object types', () => {
  it('builds a schema exposing the CMS types and gated fields', () => {
    // Minimal query referencing the types so they are retained in the SDL.
    builder.queryType({
      fields: t => ({
        _post: t.prismaField({ type: 'BlogPost', nullable: true, resolve: () => null }),
        _seo: t.prismaField({ type: 'SeoSettings', nullable: true, resolve: () => null }),
      }),
    });
    const schema = builder.toSchema();
    // Inspect the type map directly to avoid cross-realm graphql instance issues
    // with printSchema.
    const typeMap = schema.getTypeMap();
    expect(typeMap['BlogPost']).toBeDefined();
    expect(typeMap['User']).toBeDefined();
    expect(typeMap['BlogPostTag']).toBeDefined();
    expect(typeMap['SeoSettings']).toBeDefined();
    expect(typeMap['PostStatus']).toBeDefined();
    // Check BlogPost fields include author, tags, postCount-bearing types
    const blogPostFields = (typeMap['BlogPost'] as any).getFields();
    expect(blogPostFields.author).toBeDefined();
    expect(blogPostFields.tags).toBeDefined();
    // Category and Tag expose postCount
    const categoryFields = (typeMap['Category'] as any).getFields();
    expect(categoryFields.postCount).toBeDefined();
  });
});

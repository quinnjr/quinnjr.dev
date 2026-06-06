import { describe, it, expect } from 'vitest';
import { builder } from '../../../src/server/graphql/builder';

describe('pothos builder', () => {
  it('exposes a configured builder instance', () => {
    expect(builder).toBeDefined();
    expect(() => builder.queryType({})).not.toThrow();
  });
});

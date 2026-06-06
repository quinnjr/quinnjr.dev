import { describe, it, expect } from 'vitest';
import { DateTimeResolver, JSONResolver } from '../../../src/server/graphql/scalars';

describe('scalars', () => {
  it('serializes Date to ISO string', () => {
    const d = new Date('2024-01-02T03:04:05.000Z');
    expect(DateTimeResolver.serialize(d)).toBe('2024-01-02T03:04:05.000Z');
  });

  it('parses ISO string to Date', () => {
    const result = DateTimeResolver.parseValue('2024-01-02T03:04:05.000Z') as Date;
    expect(result.toISOString()).toBe('2024-01-02T03:04:05.000Z');
  });

  it('passes JSON values through', () => {
    expect(JSONResolver.serialize(['a', 'b'])).toEqual(['a', 'b']);
  });
});

import { Kind, parseValue as parseGraphQLValue } from 'graphql';
import { describe, it, expect } from 'vitest';

import { DateTimeResolver, JSONResolver } from '../../../src/server/graphql/scalars';

/** Parse a GraphQL literal source string through the JSON scalar. */
function parseJSON(source: string): unknown {
  return JSONResolver.parseLiteral(parseGraphQLValue(source), undefined);
}

describe('scalars', () => {
  it('serializes Date to ISO string', () => {
    const d = new Date('2024-01-02T03:04:05.000Z');
    expect(DateTimeResolver.serialize(d)).toBe('2024-01-02T03:04:05.000Z');
  });

  it('parses ISO string to Date', () => {
    const result = DateTimeResolver.parseValue('2024-01-02T03:04:05.000Z');
    expect(result.toISOString()).toBe('2024-01-02T03:04:05.000Z');
  });

  it('passes JSON values through', () => {
    expect(JSONResolver.serialize(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('parses scalar JSON literals', () => {
    expect(parseJSON('"hi"')).toBe('hi');
    expect(parseJSON('true')).toBe(true);
    expect(parseJSON('42')).toBe(42);
    expect(parseJSON('1.5')).toBe(1.5);
    expect(parseJSON('null')).toBeNull();
  });

  it('parses array literals', () => {
    expect(parseJSON('[1, "two", true, null]')).toEqual([1, 'two', true, null]);
  });

  it('parses object literals, including nested composites', () => {
    expect(parseJSON('{ a: 1, b: { c: ["x"] }, d: null }')).toEqual({
      a: 1,
      b: { c: ['x'] },
      d: null,
    });
  });

  it('throws rather than silently yielding undefined for unsupported kinds', () => {
    expect(() => JSONResolver.parseLiteral(parseGraphQLValue('$var'), undefined)).toThrow(
      /cannot represent/
    );
    expect(parseGraphQLValue('$var').kind).toBe(Kind.VARIABLE);
  });
});

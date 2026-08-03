import { isScalarType } from 'graphql';
import { describe, it, expect } from 'vitest';

import { schema } from '../../../src/server/graphql/schema';

// The builder is only observable through the schema it produces: asserting
// `builder` is defined (or that `queryType({})` does not throw) would pass for
// any SchemaBuilder at all. Assert instead that the custom scalars the builder
// registers actually reach the built schema, and that they behave.
describe('pothos builder', () => {
  it('registers the DateTime custom scalar on the built schema', () => {
    const dateTime = schema.getTypeMap()['DateTime'];
    expect(dateTime, 'DateTime missing from the schema type map').toBeDefined();
    expect(isScalarType(dateTime)).toBe(true);

    const iso = '2024-03-01T12:00:00.000Z';
    expect(isScalarType(dateTime) && dateTime.serialize(new Date(iso))).toBe(iso);
  });

  it('registers the JSON custom scalar on the built schema', () => {
    const json = schema.getTypeMap()['JSON'];
    expect(json, 'JSON missing from the schema type map').toBeDefined();
    expect(isScalarType(json)).toBe(true);

    const value = { a: 1, b: ['c'] };
    expect(isScalarType(json) && json.serialize(value)).toEqual(value);
  });

  it('exposes both a Query and a Mutation root type', () => {
    expect(schema.getQueryType()?.name).toBe('Query');
    expect(schema.getMutationType()?.name).toBe('Mutation');
  });
});

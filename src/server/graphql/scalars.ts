import { GraphQLScalarType, Kind } from 'graphql';

export const DateTimeResolver = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string',
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return new Date(value).toISOString();
    throw new TypeError('DateTime must be a Date or ISO string');
  },
  parseValue(value) {
    if (typeof value !== 'string') throw new TypeError('DateTime must be a string');
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new TypeError('Invalid DateTime');
    return d;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) throw new TypeError('DateTime must be a string');
    const d = new Date(ast.value);
    if (Number.isNaN(d.getTime())) throw new TypeError('Invalid DateTime');
    return d;
  },
});

export const JSONResolver = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return Number(ast.value);
      case Kind.NULL:
        return null;
      default:
        return undefined;
    }
  },
});

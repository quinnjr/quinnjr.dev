import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from 'graphql';

export const DateTimeResolver = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new TypeError('DateTime must be a Date or ISO string');
  },
  parseValue(value) {
    if (typeof value !== 'string') {
      throw new TypeError('DateTime must be a string');
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new TypeError('Invalid DateTime');
    }
    return d;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError('DateTime must be a string');
    }
    const d = new Date(ast.value);
    if (Number.isNaN(d.getTime())) {
      throw new TypeError('Invalid DateTime');
    }
    return d;
  },
});

/**
 * Recursively convert a GraphQL literal into its plain JSON value.
 *
 * Composite literals have to recurse: a scalar named "Arbitrary JSON value"
 * that returned `undefined` for `{ a: 1 }` or `[1, 2]` silently dropped the
 * argument instead of failing, so the resolver saw `undefined` and the client
 * saw success. Kinds that have no JSON representation (variables, which are
 * resolved before parseLiteral, and enums) throw rather than vanish.
 */
function parseJSONLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.NULL:
      return null;
    case Kind.LIST:
      return ast.values.map(parseJSONLiteral);
    case Kind.OBJECT:
      // Object.fromEntries rather than index assignment: the latter trips the
      // object-injection lint rule for a dynamic key.
      return Object.fromEntries(
        ast.fields.map(field => [field.name.value, parseJSONLiteral(field.value)])
      );
    case Kind.ENUM:
    case Kind.VARIABLE:
    default:
      // Variables are substituted before parseLiteral runs and enums have no
      // JSON form, so either one here is a genuine client mistake.
      throw new GraphQLError(`JSON cannot represent a ${ast.kind} literal`, { nodes: ast });
  }
}

export const JSONResolver = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: value => value,
  parseValue: value => value,
  parseLiteral: parseJSONLiteral,
});

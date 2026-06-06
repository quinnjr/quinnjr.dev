import { describe, it, expect } from 'vitest';
import { GraphQLError } from 'graphql';
import { toUserInputError, rethrowAsGraphQLError } from '../../../src/server/graphql/errors';

describe('error mapping', () => {
  it('wraps a message as BAD_USER_INPUT', () => {
    const err = toUserInputError('A post with this title already exists');
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.extensions['code']).toBe('BAD_USER_INPUT');
  });

  it('rethrows known domain errors with BAD_USER_INPUT code', () => {
    expect(() =>
      rethrowAsGraphQLError(new Error('A post with this title already exists')),
    ).toThrow(GraphQLError);
  });

  it('rethrows unknown errors as INTERNAL_SERVER_ERROR', () => {
    try {
      rethrowAsGraphQLError(new Error('some db blew up'));
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(GraphQLError);
      expect((e as GraphQLError).extensions['code']).toBe('INTERNAL_SERVER_ERROR');
    }
  });
});

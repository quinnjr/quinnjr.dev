import { GraphQLError } from 'graphql';
import { describe, it, expect } from 'vitest';

import {
  toUserInputError,
  rethrowAsGraphQLError,
  UserInputError,
  NotFoundError,
} from '../../../src/server/graphql/errors';

/** Capture the GraphQLError a rethrow produces. */
function capture(fn: () => never): GraphQLError {
  try {
    fn();
  } catch (e) {
    return e as GraphQLError;
  }
  throw new Error('should have thrown');
}

/** Stand-in for Prisma's PrismaClientKnownRequestError (duck-typed by code). */
function prismaError(code: string, message = 'prisma failure'): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

describe('error mapping', () => {
  it('wraps a message as BAD_USER_INPUT', () => {
    const err = toUserInputError('A post with this title already exists');
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.extensions['code']).toBe('BAD_USER_INPUT');
  });

  it('rethrows known domain errors with BAD_USER_INPUT code', () => {
    expect(() => rethrowAsGraphQLError(new Error('A post with this title already exists'))).toThrow(
      GraphQLError
    );
  });

  it('rethrows unknown errors as INTERNAL_SERVER_ERROR', () => {
    const err = capture(() => rethrowAsGraphQLError(new Error('some db blew up')));
    expect(err.extensions['code']).toBe('INTERNAL_SERVER_ERROR');
  });

  it('maps typed UserInputError regardless of its message', () => {
    const err = capture(() => rethrowAsGraphQLError(new UserInputError('any wording at all')));
    expect(err.extensions['code']).toBe('BAD_USER_INPUT');
    expect(err.message).toBe('any wording at all');
  });

  it('maps typed NotFoundError regardless of its message', () => {
    const err = capture(() => rethrowAsGraphQLError(new NotFoundError('Widget not found')));
    expect(err.extensions['code']).toBe('NOT_FOUND');
  });

  it('maps Prisma P2002 to BAD_USER_INPUT', () => {
    const err = capture(() => rethrowAsGraphQLError(prismaError('P2002')));
    expect(err.extensions['code']).toBe('BAD_USER_INPUT');
    expect(err.message).not.toBe('prisma failure');
  });

  it('maps Prisma P2025 to NOT_FOUND with the caller-supplied message', () => {
    const err = capture(() => rethrowAsGraphQLError(prismaError('P2025'), 'Post not found'));
    expect(err.extensions['code']).toBe('NOT_FOUND');
    expect(err.message).toBe('Post not found');
  });

  it('falls back to a generic NOT_FOUND message when none is supplied', () => {
    const err = capture(() => rethrowAsGraphQLError(prismaError('P2025')));
    expect(err.message).toBe('Record not found');
  });

  it('passes an already-coded GraphQLError through untouched', () => {
    const original = new GraphQLError('nope', { extensions: { code: 'FORBIDDEN' } });
    const err = capture(() => rethrowAsGraphQLError(original));
    expect(err).toBe(original);
    expect(err.extensions['code']).toBe('FORBIDDEN');
  });
});

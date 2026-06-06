import { GraphQLError } from 'graphql';

const USER_INPUT_MESSAGES = new Set(['A post with this title already exists']);

export function toUserInputError(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

/** Re-throw a caught service error as a coded GraphQLError. */
export function rethrowAsGraphQLError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (USER_INPUT_MESSAGES.has(message)) {
    throw toUserInputError(message);
  }
  throw new GraphQLError(message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
}

import { GraphQLError } from 'graphql';

/**
 * Domain error meaning "the client sent something invalid" (→ BAD_USER_INPUT).
 * Prefer throwing this from services over a bare Error: the message text then
 * stops being load-bearing, so rewording it cannot silently demote the error to
 * INTERNAL_SERVER_ERROR (which production masking flattens to "Unexpected
 * error").
 */
export class UserInputError extends Error {
  override readonly name = 'UserInputError';
}

/** Domain error meaning "the requested record does not exist" (→ NOT_FOUND). */
export class NotFoundError extends Error {
  override readonly name = 'NotFoundError';
}

/**
 * Legacy message matching, kept for services that still throw a bare Error with
 * these exact strings (and for specs that assert on them). New code should
 * throw UserInputError / NotFoundError instead.
 */
const USER_INPUT_MESSAGES = new Set(['A post with this title already exists']);
const NOT_FOUND_MESSAGES = new Set(['Post not found']);

/** Prisma known-request error codes we can map to a client-meaningful code. */
const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_RECORD_NOT_FOUND = 'P2025';

export function toUserInputError(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

export function toNotFoundError(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });
}

/**
 * Read a Prisma known-request error code off an unknown throwable.
 *
 * Duck-typed on purpose: an `instanceof Prisma.PrismaClientKnownRequestError`
 * check would pull the generated client into the GraphQL layer and break in
 * specs that mock that module out.
 */
function prismaErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const { code } = error as { code?: unknown };
  return typeof code === 'string' && /^P\d{4}$/.test(code) ? code : null;
}

/**
 * Re-throw a caught service error as a coded GraphQLError.
 *
 * `notFoundMessage` names the record for Prisma's P2025 ("record to
 * update/delete does not exist"), which otherwise escapes unmapped.
 */
export function rethrowAsGraphQLError(error: unknown, notFoundMessage?: string): never {
  // Already coded by a resolver — do not re-wrap and lose the code.
  if (error instanceof GraphQLError) {
    throw error;
  }
  if (error instanceof UserInputError) {
    throw toUserInputError(error.message);
  }
  if (error instanceof NotFoundError) {
    throw toNotFoundError(error.message);
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (USER_INPUT_MESSAGES.has(message)) {
    throw toUserInputError(message);
  }
  if (NOT_FOUND_MESSAGES.has(message)) {
    throw toNotFoundError(message);
  }

  const code = prismaErrorCode(error);
  if (code === PRISMA_UNIQUE_VIOLATION) {
    throw toUserInputError('A record with these values already exists');
  }
  if (code === PRISMA_RECORD_NOT_FOUND) {
    throw toNotFoundError(notFoundMessage ?? 'Record not found');
  }

  throw new GraphQLError(message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
}

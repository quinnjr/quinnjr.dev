import { CombinedGraphQLErrors } from '@apollo/client';

/**
 * Recognises the server's throttling response so the UI can report it as what
 * it is.
 *
 * Every auth surface used to answer a rejected attempt with its own fixed
 * message — the sign-in form said "Invalid email or password" no matter what
 * came back. A throttled user was therefore told their password was wrong,
 * which is both false and actively misleading: the natural response is to
 * retype the password and try again, and every retry spends another attempt
 * from the same exhausted bucket.
 *
 * The server has always sent enough to tell the two apart. `useAuthRateLimit`
 * throws a coded GraphQLError, and the code plus `retryAfterSeconds` survive
 * production error masking intact (asserted in tests/server/graphql/yoga.test.ts).
 * Only the client was throwing that away.
 */

/** Error code set by `tooManyRequestsError` on the server. */
export const RATE_LIMITED_CODE = 'TOO_MANY_REQUESTS';

interface RateLimitDetails {
  /** Whole seconds until the caller's window resets, when the server said. */
  retryAfterSeconds: number | null;
}

/**
 * Read the throttle details off a failed Apollo operation.
 *
 * @returns the details, or `null` when this was not a throttling rejection.
 */
export function rateLimitDetails(error: unknown): RateLimitDetails | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }

  const throttled = error.errors.find(
    gqlError => gqlError.extensions?.['code'] === RATE_LIMITED_CODE
  );
  if (!throttled) {
    return null;
  }

  const retryAfter = throttled.extensions?.['retryAfterSeconds'];
  return {
    retryAfterSeconds: typeof retryAfter === 'number' && retryAfter > 0 ? retryAfter : null,
  };
}

/**
 * Render a wait as something a person would say, rounded up.
 *
 * Rounding up rather than to nearest matters: telling someone to wait "1
 * minute" when 90 seconds remain earns a retry that is still refused, and
 * spends another attempt doing it.
 */
function humaniseWait(seconds: number): string {
  if (seconds < 60) {
    return 'less than a minute';
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.ceil(minutes / 60);
  return `about ${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * A user-facing message for a throttling rejection.
 *
 * @param error   the thrown Apollo error.
 * @param subject what was being attempted, e.g. 'sign-in attempts'. Named so
 *                the message says which budget ran out, since a passkey step
 *                and a password step have separate ones.
 * @returns the message, or `null` when the error was not a throttling
 *          rejection and the caller's own wording should stand.
 */
export function rateLimitMessage(error: unknown, subject = 'attempts'): string | null {
  const details = rateLimitDetails(error);
  if (!details) {
    return null;
  }

  // Deliberately does not say whether the account exists or the password was
  // right — the server refuses before checking either, and saying more here
  // would hand back the account-enumeration signal the throttle exists to deny.
  return details.retryAfterSeconds === null
    ? `Too many ${subject}. Wait a while before trying again.`
    : `Too many ${subject}. Try again in ${humaniseWait(details.retryAfterSeconds)}.`;
}

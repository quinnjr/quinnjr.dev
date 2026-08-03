/**
 * Preserves Node's native `Event` constructor before zone.js replaces it.
 *
 * zone.js overwrites the global `Event` with its own class. Node's native
 * `EventTarget.dispatchEvent` brand-checks its argument, so anything built from
 * the replaced global is rejected with:
 *
 *   TypeError [ERR_INVALID_ARG_TYPE]: The "event" argument must be an instance
 *   of Event. Received an instance of u
 *
 * GraphQL Yoga hits exactly that path when a client disconnects mid-request: it
 * aborts the request's AbortController, which dispatches an `abort` event onto
 * a native EventTarget. The throw happens inside a Node event handler, so it
 * surfaces as an *uncaught exception* and takes the whole server process down —
 * one cancelled request, and the site is offline until the container restarts.
 *
 * This module must load before zone.js (it is listed first in the `polyfills`
 * array in angular.json). It only stashes the original; `src/server.ts` decides
 * when to restore it, so browser bundles are unaffected.
 */
/* eslint-disable security/detect-object-injection --
 * The only dynamic key is this module's own Symbol; nothing here is reachable
 * from user input.
 */
export const NATIVE_EVENT = Symbol.for('quinnjr.nativeEvent');

const globals = globalThis as unknown as Record<symbol, unknown>;

if (typeof Event !== 'undefined' && globals[NATIVE_EVENT] === undefined) {
  globals[NATIVE_EVENT] = Event;
}

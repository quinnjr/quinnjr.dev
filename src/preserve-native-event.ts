/**
 * Preserves the platform's native `Event` constructor before zone.js replaces it.
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
 * This module must load before zone.js. It is listed first in the `polyfills`
 * array in angular.json, which is shared by the browser and server builds, so
 * it does run in the browser bundle too — where it does nothing beyond setting
 * one global symbol, because only `src/server.ts` imports the restore side.
 *
 * `zoneAlreadyLoaded` records whether the race was actually won. If zone.js got
 * there first, `ctor` is zone's replacement rather than the native class, and a
 * silent restore would be a no-op that looks identical to success; the restore
 * side uses this flag to complain instead.
 */
/* eslint-disable security/detect-object-injection --
 * The only dynamic key is this module's own Symbol; nothing here is reachable
 * from user input.
 */
export const NATIVE_EVENT = Symbol.for('quinnjr.nativeEvent');

export interface PreservedEvent {
  ctor: typeof Event;
  /** True when zone.js had already patched the global before this module ran. */
  zoneAlreadyLoaded: boolean;
}

const globals = globalThis as unknown as Record<symbol, unknown>;

if (typeof Event !== 'undefined' && globals[NATIVE_EVENT] === undefined) {
  const preserved: PreservedEvent = {
    ctor: Event,
    // zone.js installs `globalThis.Zone` as part of loading, so its presence
    // here means the `Event` captured above is already the patched one.
    zoneAlreadyLoaded: (globalThis as { Zone?: unknown }).Zone !== undefined,
  };
  globals[NATIVE_EVENT] = preserved;
}

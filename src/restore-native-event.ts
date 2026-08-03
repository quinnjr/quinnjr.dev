/**
 * Restores the native `Event` global, undoing zone.js's replacement.
 *
 * Import this for its side effect, and import it BEFORE anything that pulls in
 * graphql-yoga. ES module imports are evaluated in declaration order, so an
 * earlier `import './restore-native-event'` runs before the Yoga module body —
 * which is what matters, because whatwg-node captures the `Event` constructor
 * once at module scope. Restoring afterwards is too late: it keeps the stale
 * reference, dispatches a non-native event into a native `EventTarget` on
 * client disconnect, and takes the process down with an uncaught
 * ERR_INVALID_ARG_TYPE.
 *
 * See src/preserve-native-event.ts, which stashes the original before zone.js
 * loads (it is listed first in the `polyfills` array in angular.json).
 *
 * Every failure mode below is reported loudly. A missing or already-patched
 * stash makes the restore a silent no-op, and the protection it provides has no
 * other symptom until the first mid-request client disconnect kills the
 * process — by which point the site is down and the cause is three layers away.
 */
/* eslint-disable security/detect-object-injection --
 * The only dynamic key is a module-local Symbol; nothing here is reachable
 * from user input.
 */

import { NATIVE_EVENT, type PreservedEvent } from './preserve-native-event';

const FAILURE_CONSEQUENCE =
  'a client disconnecting mid-request will crash the process with ERR_INVALID_ARG_TYPE';

const stashed = (globalThis as unknown as Record<symbol, unknown>)[NATIVE_EVENT] as
  | PreservedEvent
  | undefined;

if (typeof stashed?.ctor !== 'function') {
  console.error(
    `restore-native-event: no preserved Event constructor found. src/preserve-native-event.ts ` +
      `must be first in the "polyfills" array in angular.json; ${FAILURE_CONSEQUENCE}.`
  );
} else if (stashed.zoneAlreadyLoaded) {
  console.error(
    `restore-native-event: zone.js had already patched globalThis.Event when it was preserved, ` +
      `so the stashed constructor is zone's, not the native one; ${FAILURE_CONSEQUENCE}.`
  );
} else {
  globalThis.Event = stashed.ctor;
}

/**
 * Re-assert the native `Event` global.
 *
 * Restoring once at startup is not enough: every SSR render installs Angular's
 * server DOM globals, which put the non-native constructor back. graphql-yoga
 * resolves `Event` when it aborts a request — on the response's `close` event,
 * i.e. after any interleaved render — so the global has to be correct at that
 * moment, not merely at boot.
 */
export function restoreNativeEvent(): void {
  if (typeof stashed?.ctor === 'function' && !stashed.zoneAlreadyLoaded) {
    globalThis.Event = stashed.ctor;
  }
}

/**
 * Restores Node's native `Event` global, undoing zone.js's replacement.
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
 */
/* eslint-disable security/detect-object-injection --
 * The only dynamic key is a module-local Symbol; nothing here is reachable
 * from user input.
 */
import { NATIVE_EVENT } from './preserve-native-event';

const preserved = (globalThis as unknown as Record<symbol, unknown>)[NATIVE_EVENT];

if (typeof preserved === 'function' && globalThis.Event !== preserved) {
  globalThis.Event = preserved as typeof Event;
}

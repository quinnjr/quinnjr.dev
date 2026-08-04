/**
 * Restores the native `Event` global, undoing Angular's server DOM shim.
 *
 * `@angular/platform-server` renders against domino and installs domino's DOM
 * classes as globals with `Object.assign(globalThis, domino.impl)`, which
 * overwrites `globalThis.Event`. Node's native `EventTarget.dispatchEvent`
 * brand-checks its argument, so anything built from the replaced global is
 * rejected with:
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
 * Import this for its side effect, and import it BEFORE anything that pulls in
 * graphql-yoga. ES module imports are evaluated in declaration order, so an
 * earlier `import './restore-native-event'` runs before the Yoga module body —
 * which is what matters, because whatwg-node captures the `Event` constructor
 * once at module scope. Restoring afterwards is too late: it keeps the stale
 * reference, dispatches a non-native event into a native `EventTarget` on
 * client disconnect, and takes the process down.
 */

/**
 * Recover Node's own `Event` constructor, whatever the global currently holds.
 *
 * Reading it back from `globalThis` is not an option — that is the very binding
 * domino overwrites, and this module is deliberately loaded *after* the shim so
 * that it gets the last word. Instead the class is read off a real native event
 * instance: `AbortController`/`AbortSignal` are Node built-ins that domino does
 * not shim (`domino.impl` covers DOM node and event *types*, not the abort
 * primitives), so aborting a throwaway controller dispatches a genuinely native
 * `Event` whose prototype carries the constructor we want.
 */
function captureNativeEvent(): typeof Event | undefined {
  try {
    const controller = new AbortController();
    let ctor: typeof Event | undefined;
    controller.signal.addEventListener(
      'abort',
      // `event.constructor` resolves through the prototype chain to the same
      // class `Object.getPrototypeOf(event).constructor` would give, but stays
      // typed: `getPrototypeOf` returns `any`, so reading `.constructor` off it
      // was an unchecked member access on a value the compiler knew nothing
      // about.
      event => {
        ctor = event.constructor as typeof Event;
      },
      { once: true }
    );
    controller.abort();
    return ctor;
  } catch (error) {
    // The swallowed exception was the only evidence of WHY the capture failed,
    // and the failure is three layers away from the crash it eventually causes.
    console.error('restore-native-event: could not capture the native Event constructor', error);
    return undefined;
  }
}

const nativeEvent = captureNativeEvent();

if (nativeEvent === undefined) {
  // Fail at boot rather than serve traffic.
  //
  // This branch means the process has DIAGNOSED that it cannot survive a
  // mid-request client disconnect. Logging and continuing meant starting a
  // server guaranteed to die on the first cancelled request, with the only
  // clue a single line emitted at startup — and after the restart, the same
  // line again, so the operator sees a crash-loop with no visible cause.
  //
  // Refusing to start is strictly more diagnosable: an orchestrator surfaces a
  // boot failure directly, whereas an intermittent uncaught exception three
  // layers down looks like a network problem. A server that cannot stay up is
  // not more available for having started.
  throw new Error(
    'restore-native-event: could not recover the native Event constructor. A client ' +
      'disconnecting mid-request would crash the process with ERR_INVALID_ARG_TYPE, so ' +
      'refusing to start rather than serving traffic that is guaranteed to fail.'
  );
}

globalThis.Event = nativeEvent;

/**
 * Re-assert the native `Event` global.
 *
 * Restoring once at startup is not enough: `DominoAdapter.makeCurrent()` re-runs
 * `Object.assign(globalThis, domino.impl)` on every SSR render, which puts the
 * non-native constructor back. graphql-yoga resolves `Event` when it aborts a
 * request — on the response's `close` event, i.e. after any interleaved render —
 * so the global has to be correct at that moment, not merely at boot.
 */
export function restoreNativeEvent(): void {
  if (nativeEvent !== undefined) {
    globalThis.Event = nativeEvent;
  }
}

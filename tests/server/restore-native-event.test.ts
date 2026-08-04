import { describe, it, expect, afterEach } from 'vitest';

/**
 * The mechanism that stops the SSR process dying on a mid-request client
 * disconnect, and it had no test.
 *
 * `@angular/platform-server` installs domino's DOM classes over `globalThis`
 * on every render, replacing `Event`. Node's `EventTarget.dispatchEvent`
 * brand-checks its argument, so anything built from the replaced global is
 * rejected with `ERR_INVALID_ARG_TYPE` — thrown inside a Node event handler,
 * which makes it an UNCAUGHT exception that takes the whole server down. Yoga
 * hits exactly that path when it aborts a request's AbortController.
 *
 * `captureNativeEvent` recovers the real constructor by aborting a throwaway
 * `AbortController` and reading `event.constructor`, on the assumption that
 * domino does not shim the abort primitives. That assumption is load-bearing
 * and was unverified: if it captured domino's class instead, the only symptom
 * would be a silent no-op and a production outage on the first cancelled
 * request.
 *
 * The `dispatchEvent` round-trip below is the independent oracle — it fails
 * with ERR_INVALID_ARG_TYPE if the wrong class was captured, rather than
 * merely asserting that some assignment happened.
 */

const NATIVE_EVENT = globalThis.Event;

afterEach(() => {
  globalThis.Event = NATIVE_EVENT;
});

/** Stands in for domino's shim: a plain class Node's EventTarget will reject. */
class ImpostorEvent {
  constructor(public type: string) {}
}

describe('restoreNativeEvent', () => {
  it('puts back an Event that a native EventTarget accepts', async () => {
    const { restoreNativeEvent } = await import('../../src/restore-native-event');

    globalThis.Event = ImpostorEvent as unknown as typeof Event;
    restoreNativeEvent();

    const target = new EventTarget();
    expect(() => target.dispatchEvent(new globalThis.Event('abort'))).not.toThrow();
    expect(globalThis.Event).toBe(NATIVE_EVENT);
  });

  // Proves the oracle above is real: the same dispatch DOES throw when the
  // global is left shimmed. Without this, the test above could pass for a
  // reason unrelated to the restore.
  it('is dispatching an event a shimmed global would fail', () => {
    globalThis.Event = ImpostorEvent as unknown as typeof Event;

    const target = new EventTarget();
    expect(() => target.dispatchEvent(new globalThis.Event('abort'))).toThrow();
  });

  it('survives being called repeatedly, since every render re-shims', async () => {
    const { restoreNativeEvent } = await import('../../src/restore-native-event');
    const target = new EventTarget();

    for (let render = 0; render < 3; render++) {
      globalThis.Event = ImpostorEvent as unknown as typeof Event;
      restoreNativeEvent();
      expect(() => target.dispatchEvent(new globalThis.Event('abort'))).not.toThrow();
    }
  });
});

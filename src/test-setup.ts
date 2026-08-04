/* eslint-disable security/detect-object-injection --
 * The only dynamic keys here are a numeric array index and a
 * 'localStorage' | 'sessionStorage' literal union; neither is attacker-
 * reachable, and this file is never bundled into the application.
 */

/**
 * Global setup for the Angular unit-test run (wired via `setupFiles` in
 * angular.json).
 *
 * NOTE on `zone.js`: the application is zoneless — no `zone.js` polyfill, and
 * both configs use `provideZonelessChangeDetection()` — but `zone.js` is still
 * a devDependency, on purpose. `@angular/build:unit-test` picks its TestBed
 * bootstrap by trying to RESOLVE `zone.js`
 * (`unit-test/runners/vitest/build-options.js`, `getZoneTestingStrategy`):
 * resolvable means it emits a guarded `await import('zone.js/testing')`,
 * unresolvable means it emits nothing. Leaving the package undeclared made that
 * choice depend on whether pnpm happened to hoist it as an `@angular/core` peer
 * — which differed between a developer's incremental `node_modules` and CI's
 * `--frozen-lockfile` install, so all 21 suites failed in CI with
 * "Failed to resolve import 'zone.js/testing'" while passing locally.
 * Declaring it makes the strategy deterministic; the guard means Zone is still
 * never actually loaded, so the tests run zoneless like the app does.
 *
 * The builder runs specs in jsdom, but the document is created on an opaque
 * origin, and jsdom refuses to expose Web Storage to an opaque origin. That
 * leaves `localStorage` undefined as a global, so every spec whose injector
 * constructs `AuthService` — which reads a token at construction — dies with
 * "Cannot read properties of undefined (reading 'getItem')" before its own
 * assertions ever run.
 *
 * Installing an in-memory implementation is the least invasive fix: it keeps
 * production code free of test-only guards and matches how the storage behaves
 * in a real browser.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function ensureStorage(name: 'localStorage' | 'sessionStorage'): void {
  const target = globalThis as unknown as Record<string, unknown>;
  if (target[name]) {
    return;
  }

  const storage = new MemoryStorage();
  target[name] = storage;
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, name, { value: storage, configurable: true });
  }
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');

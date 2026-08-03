import { createHash } from 'node:crypto';

import { GraphQLError } from 'graphql';
import { singleton } from 'tsyringe';

/**
 * Single wording for every throttled path. It never names the account, the
 * reason, or whether the subject exists — a caller probing for valid emails or
 * live mfaTokens learns nothing from being rate limited that it did not
 * already know from being slow.
 */
export const RATE_LIMITED_MESSAGE = 'Too many attempts. Please try again later.';

/** Result of a limiter decision. `retryAfterMs` is 0 when the call is allowed. */
export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

interface WindowEntry {
  count: number;
  /** Epoch ms at which this fixed window ends and the counter resets. */
  resetAt: number;
}

/** How often expired windows are swept out of the map. */
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Hard ceiling on tracked keys. The IP component of a key comes from a header
 * an attacker controls (see the X-Forwarded-For note in graphql/yoga.ts), so an
 * unbounded map is itself a memory-exhaustion vector. On overflow we sweep, and
 * failing that drop the oldest entries — degrading to "some attackers get a
 * fresh bucket" rather than "the process dies".
 */
const MAX_TRACKED_KEYS = 50_000;

/**
 * Maximum password verifications allowed to run at once. Argon2id at
 * m=19456 is deliberately expensive and `login` runs it even for unknown
 * emails (the DUMMY_PASSWORD_HASH path that defeats timing enumeration), so
 * unbounded concurrency lets a handful of anonymous requests monopolise the
 * single Node process that also renders SSR.
 */
const DEFAULT_VERIFY_CONCURRENCY = 4;

/**
 * Counting semaphore with FIFO queueing. Callers past the cap wait rather than
 * being rejected: a legitimate sign-in should be slow under load, not fail.
 */
export class Semaphore {
  private inFlight = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly capacity: number) {
    if (capacity < 1) {
      throw new RangeError('Semaphore capacity must be at least 1');
    }
  }

  /** Slots currently held. Exposed for tests and diagnostics. */
  get active(): number {
    return this.inFlight;
  }

  /** Callers currently queued behind the cap. */
  get waiting(): number {
    return this.waiters.length;
  }

  /**
   * Acquire a slot, waiting if the cap is reached. Resolves with a release
   * function that is safe to call more than once.
   */
  async acquire(): Promise<() => void> {
    if (this.inFlight < this.capacity) {
      this.inFlight += 1;
    } else {
      await new Promise<void>(resolve => this.waiters.push(resolve));
      // The releasing caller handed its slot straight to us, so inFlight is
      // already accounted for and must not be incremented again here.
    }

    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.handOff();
    };
  }

  /** Run `fn` holding a slot, releasing it even if `fn` rejects. */
  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Pass the freed slot to the next waiter instead of decrementing and letting
   * it re-acquire — that gap would let a later arrival barge ahead of the queue.
   */
  private handOff(): void {
    const next = this.waiters.shift();
    if (next) {
      next();
      return;
    }
    this.inFlight -= 1;
  }
}

/**
 * In-memory fixed-window rate limiter.
 *
 * Deliberately hand-rolled and process-local: the app runs as a single Node
 * process, so a shared store would add a dependency and a network hop for no
 * gain. If this is ever scaled to multiple instances the limits become
 * per-instance and this must move to a shared store — see the report note.
 */
@singleton()
export class RateLimitService {
  private readonly windows = new Map<string, WindowEntry>();
  private readonly sweepTimer: NodeJS.Timeout;

  /** Gate for expensive password verification. See DEFAULT_VERIFY_CONCURRENCY. */
  readonly verifyGate = new Semaphore(
    Number(process.env['AUTH_VERIFY_CONCURRENCY'] ?? DEFAULT_VERIFY_CONCURRENCY)
  );

  constructor() {
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    // Never hold the process open for a housekeeping timer.
    this.sweepTimer.unref();
  }

  /**
   * Record an attempt against `key` and report whether it is within `limit`
   * for the current `windowMs` window.
   *
   * Blocked attempts still count, so hammering the endpoint cannot shorten the
   * cooldown — but they do not extend the window either, which keeps
   * `retryAfterMs` honest.
   */
  check(key: string, limit: number, windowMs: number, now: number = Date.now()): RateLimitResult {
    const existing = this.windows.get(key);

    if (!existing || now >= existing.resetAt) {
      if (!existing && this.windows.size >= MAX_TRACKED_KEYS) {
        this.evict(now);
      }
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      const withinLimit = limit >= 1;
      return { allowed: withinLimit, retryAfterMs: withinLimit ? 0 : windowMs };
    }

    existing.count += 1;
    if (existing.count <= limit) {
      return { allowed: true, retryAfterMs: 0 };
    }
    return { allowed: false, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }

  /**
   * Check without recording an attempt. Useful for reporting remaining budget
   * without spending it.
   */
  peek(key: string, limit: number, now: number = Date.now()): RateLimitResult {
    const existing = this.windows.get(key);
    if (!existing || now >= existing.resetAt) {
      return { allowed: true, retryAfterMs: 0 };
    }
    if (existing.count < limit) {
      return { allowed: true, retryAfterMs: 0 };
    }
    return { allowed: false, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }

  /** Forget a single key — e.g. after a successful sign-in. */
  reset(key: string): void {
    this.windows.delete(key);
  }

  /** Forget every key. Test hook; also used on shutdown. */
  resetAll(): void {
    this.windows.clear();
  }

  /** Number of tracked keys. Test/diagnostic hook. */
  get size(): number {
    return this.windows.size;
  }

  /** Stop the sweep timer. Call from shutdown paths. */
  dispose(): void {
    clearInterval(this.sweepTimer);
    this.windows.clear();
  }

  /**
   * Build a stable key from parts. Values that are credentials or PII (emails,
   * mfaTokens) are hashed by the caller via `hashSubject` so this map never
   * holds them in the clear.
   */
  static key(...parts: string[]): string {
    return parts.join('|');
  }

  /**
   * Truncated SHA-256 of a subject identifier. Not a security boundary — it
   * keeps raw emails and bearer-ish tokens out of a long-lived in-memory map
   * (and out of any heap dump) while staying collision-free enough for keying.
   */
  static hashSubject(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 32);
  }

  private sweep(now: number = Date.now()): void {
    for (const [key, entry] of this.windows) {
      if (now >= entry.resetAt) {
        this.windows.delete(key);
      }
    }
  }

  /**
   * Overflow relief: drop expired entries first, and if the map is still at the
   * ceiling drop the oldest-expiring tenth. Map iteration order is insertion
   * order, which is a good enough proxy for "least recently created".
   */
  private evict(now: number): void {
    this.sweep(now);
    if (this.windows.size < MAX_TRACKED_KEYS) {
      return;
    }
    let toDrop = Math.ceil(MAX_TRACKED_KEYS / 10);
    for (const key of this.windows.keys()) {
      if (toDrop <= 0) {
        break;
      }
      this.windows.delete(key);
      toDrop -= 1;
    }
  }
}

/**
 * The error surfaced to throttled callers. `retryAfterMs` is rounded up to
 * whole seconds so it cannot be used as a high-resolution side channel.
 */
export function tooManyRequestsError(retryAfterMs: number): GraphQLError {
  return new GraphQLError(RATE_LIMITED_MESSAGE, {
    extensions: {
      code: 'TOO_MANY_REQUESTS',
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    },
  });
}

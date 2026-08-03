import { GraphQLError } from 'graphql';
import { container } from 'tsyringe';

import {
  RATE_LIMITED_MESSAGE,
  RateLimitService,
  Semaphore,
  tooManyRequestsError,
} from '../../../../src/server/services/rate-limit.service';

const WINDOW = 15 * 60 * 1000;

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    container.clearInstances();
    service = new RateLimitService();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('check', () => {
    it('allows attempts up to the limit', () => {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const result = service.check('ip|login|1.2.3.4', 5, WINDOW);
        expect(result.allowed).toBe(true);
        expect(result.retryAfterMs).toBe(0);
      }
    });

    it('blocks the attempt past the limit and reports a positive retryAfterMs', () => {
      const now = 1_000_000;
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        service.check('ip|login|1.2.3.4', 5, WINDOW, now);
      }

      const blocked = service.check('ip|login|1.2.3.4', 5, WINDOW, now);

      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBe(WINDOW);
    });

    it('keeps blocking for the remainder of the window without extending it', () => {
      const now = 1_000_000;
      for (let attempt = 1; attempt <= 6; attempt += 1) {
        service.check('ip|login|1.2.3.4', 5, WINDOW, now);
      }

      // Hammering the endpoint must not push the reset further out, otherwise a
      // client could lock itself out indefinitely (and the countdown would lie).
      const later = service.check('ip|login|1.2.3.4', 5, WINDOW, now + 60_000);

      expect(later.allowed).toBe(false);
      expect(later.retryAfterMs).toBe(WINDOW - 60_000);
    });

    it('resets once the window expires', () => {
      const now = 1_000_000;
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        service.check('ip|login|1.2.3.4', 5, WINDOW, now);
      }
      expect(service.check('ip|login|1.2.3.4', 5, WINDOW, now).allowed).toBe(false);

      const afterWindow = service.check('ip|login|1.2.3.4', 5, WINDOW, now + WINDOW);

      expect(afterWindow.allowed).toBe(true);
      expect(afterWindow.retryAfterMs).toBe(0);
    });

    it('tracks separate keys independently', () => {
      const now = 1_000_000;
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        service.check('ip|login|1.2.3.4', 5, WINDOW, now);
      }

      expect(service.check('ip|login|1.2.3.4', 5, WINDOW, now).allowed).toBe(false);
      expect(service.check('ip|login|5.6.7.8', 5, WINDOW, now).allowed).toBe(true);
      expect(service.check('ip|verifyPasskey|1.2.3.4', 5, WINDOW, now).allowed).toBe(true);
      expect(service.check('subject|login|abc', 5, WINDOW, now).allowed).toBe(true);
    });

    it('blocks immediately when the limit is zero', () => {
      const result = service.check('ip|login|1.2.3.4', 0, WINDOW, 1_000);

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBe(WINDOW);
    });
  });

  describe('peek', () => {
    it('reports remaining budget without spending it', () => {
      const now = 1_000_000;
      service.check('ip|login|1.2.3.4', 2, WINDOW, now);

      expect(service.peek('ip|login|1.2.3.4', 2, now).allowed).toBe(true);
      expect(service.peek('ip|login|1.2.3.4', 2, now).allowed).toBe(true);
      expect(service.check('ip|login|1.2.3.4', 2, WINDOW, now).allowed).toBe(true);
      expect(service.peek('ip|login|1.2.3.4', 2, now).allowed).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears a single key', () => {
      const now = 1_000_000;
      service.check('a', 1, WINDOW, now);
      service.check('b', 1, WINDOW, now);
      expect(service.check('a', 1, WINDOW, now).allowed).toBe(false);

      service.reset('a');

      expect(service.check('a', 1, WINDOW, now).allowed).toBe(true);
      expect(service.check('b', 1, WINDOW, now).allowed).toBe(false);
    });

    it('clears every key', () => {
      service.check('a', 1, WINDOW);
      service.check('b', 1, WINDOW);

      service.resetAll();

      expect(service.size).toBe(0);
    });
  });

  describe('key derivation', () => {
    it('never stores the raw subject', () => {
      const email = 'victim@example.com';
      const key = RateLimitService.key('subject', 'login', RateLimitService.hashSubject(email));

      expect(key).not.toContain(email);
      expect(RateLimitService.hashSubject(email)).toHaveLength(32);
    });

    it('hashes deterministically so repeat attempts land in one bucket', () => {
      expect(RateLimitService.hashSubject('a@example.com')).toBe(
        RateLimitService.hashSubject('a@example.com')
      );
      expect(RateLimitService.hashSubject('a@example.com')).not.toBe(
        RateLimitService.hashSubject('b@example.com')
      );
    });
  });

  describe('resolution through the container', () => {
    it('resolves as a singleton so buckets are shared across call sites', () => {
      container.registerSingleton(RateLimitService);

      const first = container.resolve(RateLimitService);
      const second = container.resolve(RateLimitService);

      expect(second).toBe(first);
      first.dispose();
    });
  });
});

describe('tooManyRequestsError', () => {
  it('carries the TOO_MANY_REQUESTS code', () => {
    const error = tooManyRequestsError(60_000);

    expect(error).toBeInstanceOf(GraphQLError);
    expect(error.extensions['code']).toBe('TOO_MANY_REQUESTS');
    expect(error.extensions['retryAfterSeconds']).toBe(60);
  });

  it('rounds sub-second waits up to one second rather than reporting zero', () => {
    expect(tooManyRequestsError(0).extensions['retryAfterSeconds']).toBe(1);
    expect(tooManyRequestsError(1_400).extensions['retryAfterSeconds']).toBe(2);
  });

  it('uses one message regardless of whether the subject exists', () => {
    // The limiter is keyed on a hash and never consults the user table, so the
    // wording an attacker sees is byte-identical for a real account, an unknown
    // email, and a plain IP block. Enumeration via throttling is impossible.
    const knownAccount = tooManyRequestsError(30_000);
    const unknownAccount = tooManyRequestsError(900_000);
    const ipOnly = tooManyRequestsError(450_000);

    expect(knownAccount.message).toBe(RATE_LIMITED_MESSAGE);
    expect(unknownAccount.message).toBe(RATE_LIMITED_MESSAGE);
    expect(ipOnly.message).toBe(RATE_LIMITED_MESSAGE);
    expect(RATE_LIMITED_MESSAGE).not.toMatch(/account|email|user|exist|password/i);
  });
});

describe('Semaphore', () => {
  it('rejects a capacity below one', () => {
    expect(() => new Semaphore(0)).toThrow(RangeError);
  });

  it('runs up to the cap concurrently and queues the rest', async () => {
    const semaphore = new Semaphore(2);
    const releases: Array<() => void> = [];

    releases.push(await semaphore.acquire());
    releases.push(await semaphore.acquire());
    expect(semaphore.active).toBe(2);

    let thirdAcquired = false;
    const third = semaphore.acquire().then(release => {
      thirdAcquired = true;
      return release;
    });

    await Promise.resolve();
    expect(thirdAcquired).toBe(false);
    expect(semaphore.waiting).toBe(1);

    releases[0]?.();
    await third;
    expect(thirdAcquired).toBe(true);
    expect(semaphore.active).toBe(2);
  });

  it('caps observed concurrency under a burst', async () => {
    const semaphore = new Semaphore(4);
    let inFlight = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 20 }, () =>
        semaphore.runExclusive(async () => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          await new Promise(resolve => setTimeout(resolve, 1));
          inFlight -= 1;
        })
      )
    );

    expect(peak).toBe(4);
    expect(semaphore.active).toBe(0);
  });

  it('releases the slot when the guarded work throws', async () => {
    const semaphore = new Semaphore(1);

    await expect(
      semaphore.runExclusive(async () => {
        throw new Error('argon2 exploded');
      })
    ).rejects.toThrow('argon2 exploded');

    expect(semaphore.active).toBe(0);
    // A leaked slot would deadlock every subsequent sign-in, so prove the next
    // caller still gets through.
    await expect(semaphore.runExclusive(async () => 'ok')).resolves.toBe('ok');
  });

  it('ignores a double release so one caller cannot free another slot', async () => {
    const semaphore = new Semaphore(1);
    const release = await semaphore.acquire();

    release();
    release();

    expect(semaphore.active).toBe(0);
  });
});

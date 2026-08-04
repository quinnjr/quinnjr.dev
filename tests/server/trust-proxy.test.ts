import { describe, it, expect } from 'vitest';

import { trustProxyHops } from '../../src/server/trust-proxy';

/**
 * `trust proxy` is what makes `req.ip` — and so the rate limiter's per-IP
 * bucket — reflect the caller rather than the nearest hop. The parsing matters
 * more than it looks: Express treats a BOOLEAN `true` as "trust the entire
 * X-Forwarded-For chain", which resolves `req.ip` to the leftmost entry, the
 * one the client writes itself. Any input that quietly became `true` would put
 * back exactly the forgeable behaviour this setting exists to remove.
 */
describe('trustProxyHops', () => {
  it('defaults to one hop when unset or blank', () => {
    expect(trustProxyHops({})).toBe(1);
    expect(trustProxyHops({ SSR_TRUST_PROXY: '' })).toBe(1);
    expect(trustProxyHops({ SSR_TRUST_PROXY: '   ' })).toBe(1);
  });

  it('honours an explicit hop count, including zero', () => {
    expect(trustProxyHops({ SSR_TRUST_PROXY: '0' })).toBe(0);
    expect(trustProxyHops({ SSR_TRUST_PROXY: '2' })).toBe(2);
  });

  // Falling back to 1 rather than to a truthy value is the point: a typo must
  // not be the thing that re-enables client-controlled addresses.
  it('falls back to one hop rather than trusting the whole chain on bad input', () => {
    for (const raw of ['true', 'yes', 'all', '-1', '1.5', 'NaN', 'Infinity']) {
      const hops = trustProxyHops({ SSR_TRUST_PROXY: raw });
      expect(hops).toBe(1);
      expect(typeof hops).toBe('number');
    }
  });
});

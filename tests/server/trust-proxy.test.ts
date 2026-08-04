import { describe, it, expect } from 'vitest';

import { trustProxyHops } from '../../src/server/trust-proxy';

/**
 * `trust proxy` decides what `req.ip` resolves to, and `req.ip` keys the rate
 * limiter's per-IP bucket. Two failure directions, both bad, and the parsing is
 * what stands between a config typo and either one:
 *
 *   - Boolean `true`, or a hop count above the real chain length, makes Express
 *     return the LEFTMOST X-Forwarded-For entry — the one the client wrote — so
 *     an attacker mints a fresh bucket per request.
 *   - Too low a count behind a real proxy collapses every visitor into the
 *     proxy's own address, so one bucket serves the whole internet.
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
    expect(trustProxyHops({ SSR_TRUST_PROXY: ' 3 ' })).toBe(3);
  });

  // `Number()` alone accepts every one of these: 0x10 is 16, 1e3 is 1000, and
  // '1.0' is 1. An over-count is not a harmless typo — it is what makes Express
  // hand back the client-written end of the header — so the numeric form is
  // matched with an explicit decimal pattern and capped.
  it.each(['0x10', '1e3', '0b11', '1.0', '1.5', '-1', 'Infinity', 'NaN', '+2', '1_0'])(
    'refuses the non-decimal or out-of-range value %j rather than over-trusting',
    raw => {
      expect(trustProxyHops({ SSR_TRUST_PROXY: raw })).toBe(1);
    }
  );

  it('caps an implausible hop count instead of honouring it', () => {
    expect(trustProxyHops({ SSR_TRUST_PROXY: '9' })).toBe(1);
    expect(trustProxyHops({ SSR_TRUST_PROXY: '1000' })).toBe(1);
    // The boundary itself is still honoured.
    expect(trustProxyHops({ SSR_TRUST_PROXY: '8' })).toBe(8);
  });

  // The safer form where the proxy's address is known: an address list cannot
  // be over-counted, because Express trusts a hop only if it matches.
  it('accepts an address, CIDR, or named-subnet list', () => {
    expect(trustProxyHops({ SSR_TRUST_PROXY: 'loopback' })).toEqual(['loopback']);
    expect(trustProxyHops({ SSR_TRUST_PROXY: '10.0.0.0/8' })).toEqual(['10.0.0.0/8']);
    expect(trustProxyHops({ SSR_TRUST_PROXY: 'loopback, 10.0.0.0/8 ,192.168.0.1' })).toEqual([
      'loopback',
      '10.0.0.0/8',
      '192.168.0.1',
    ]);
  });

  // The single most important property: never boolean `true`, whatever the
  // input. That value trusts the entire chain and is the forgeable case.
  it.each(['true', 'TRUE', 'yes', 'all', '*', '1,true'])(
    'never returns boolean true for %j',
    raw => {
      expect(trustProxyHops({ SSR_TRUST_PROXY: raw })).not.toBe(true);
    }
  );
});

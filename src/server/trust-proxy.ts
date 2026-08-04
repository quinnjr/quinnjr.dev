/**
 * Value for Express's `trust proxy` setting.
 *
 * This decides what `req.ip` resolves to, and `req.ip` is the key of the
 * rate limiter's per-IP bucket — so getting it wrong breaks the limiter in one
 * of two opposite ways, and there is no default that is safe for both:
 *
 *   - **Too low** (`0` behind a real proxy): `req.ip` is the proxy's own
 *     address for every visitor, so the whole internet shares one bucket.
 *     Ten login attempts then lock out every user at once — a trivial
 *     denial of service, not a hardening.
 *   - **Too high** (`1` with nothing actually appending X-Forwarded-For, or a
 *     count above the real chain length): Express walks past the entries a
 *     trusted proxy wrote and returns one the CLIENT wrote, so an attacker
 *     mints a fresh bucket per request by rotating the header — the forgeable
 *     behaviour this setting exists to remove.
 *
 * The hop count is therefore a deployment fact, not a preference. Prefer the
 * address form (`SSR_TRUST_PROXY="10.0.0.0/8"`, or a comma-separated list)
 * where the proxy's address is known: an address list cannot be over-counted,
 * because Express trusts a hop only if it matches, regardless of chain length.
 *
 * Default `1` matches DigitalOcean App Platform, which is the deployment this
 * ships to and which appends exactly one entry. It is WRONG — and forgeable —
 * for any deployment where the process is reachable without traversing that
 * edge, so such deployments must set this explicitly.
 *
 * Lives in its own module so it can be tested without importing `src/server.ts`,
 * which pulls in the Angular SSR bootstrap and needs the JIT compiler.
 */

import { isIP } from 'node:net';

/** More hops than any realistic chain; a larger number is a typo, and honouring
 *  it would trust the client-written end of X-Forwarded-For. */
const MAX_HOPS = 8;

export type TrustProxySetting = number | string[];

/**
 * Parse `SSR_TRUST_PROXY` into a value Express accepts.
 *
 * Returns a number of trusted hops, or a list of trusted addresses/CIDRs.
 * Deliberately never returns boolean `true`: that tells Express to trust the
 * entire X-Forwarded-For chain, which resolves `req.ip` to the leftmost entry —
 * the one the client writes itself.
 *
 * Anything unparseable falls back to the default rather than to something
 * permissive, and the numeric form is matched with an explicit decimal pattern:
 * `Number()` alone accepts `0x10` (16), `1e3` (1000) and `1.0`, so a typo in a
 * deployment variable could silently become an over-count and hand the caller
 * control of `req.ip`.
 */
export function trustProxyHops(env: NodeJS.ProcessEnv = process.env): TrustProxySetting {
  const raw = env['SSR_TRUST_PROXY']?.trim();
  if (!raw) {
    return 1;
  }

  if (/^\d+$/.test(raw)) {
    const hops = Number(raw);
    return hops <= MAX_HOPS ? hops : 1;
  }

  // Address / CIDR / named-subnet form. Every entry is validated here rather
  // than left to Express: without this check a malformed NUMERIC value like
  // `0x10` or `-1` failed the decimal test above and then fell through to be
  // treated as an address, so a hop-count typo silently became a nonsense trust
  // list. Express would throw on it at startup, which is loud but reports the
  // wrong problem.
  const entries = raw
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  return entries.length > 0 && entries.every(isTrustedAddressEntry) ? entries : 1;
}

/** Express's named subnets, accepted verbatim. */
const NAMED_SUBNETS = new Set(['loopback', 'linklocal', 'uniquelocal']);

/** True for a named subnet, a bare IP, or an IP with a CIDR prefix. */
function isTrustedAddressEntry(entry: string): boolean {
  if (NAMED_SUBNETS.has(entry)) {
    return true;
  }
  const parts = entry.split('/');
  if (parts.length > 2) {
    return false;
  }
  const address = parts[0] ?? '';
  const family = isIP(address);
  if (family === 0) {
    return false;
  }
  if (parts.length === 1) {
    return true;
  }
  // A prefix length must be decimal and within range for the address family.
  const prefix = parts[1];
  if (!/^\d+$/.test(prefix)) {
    return false;
  }
  return Number(prefix) <= (family === 4 ? 32 : 128);
}

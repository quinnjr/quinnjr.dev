/**
 * Trusted reverse-proxy hop count for Express's `trust proxy` setting.
 *
 * Deliberately numeric rather than boolean: `true` tells Express to trust the
 * whole X-Forwarded-For chain, which resolves `req.ip` to the LEFTMOST entry —
 * the one a client writes itself. That is the forgeable behaviour the setting
 * exists to remove, so an unparseable or negative override falls back to 1
 * rather than to "trust everything".
 *
 * Lives in its own module so it can be tested without importing `src/server.ts`,
 * which pulls in the Angular SSR bootstrap and needs the JIT compiler.
 */
export function trustProxyHops(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env['SSR_TRUST_PROXY'];
  if (raw === undefined || raw.trim() === '') {
    return 1;
  }
  const hops = Number(raw);
  return Number.isInteger(hops) && hops >= 0 ? hops : 1;
}

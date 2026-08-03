import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Per-route rendering strategy.
 *
 * Everything public is server-rendered — that is what puts the metadata and
 * content in the delivered HTML for crawlers and answer engines.
 *
 * The authenticated area is deliberately NOT. `authGuard` decides from a token
 * in `localStorage`, which does not exist on the server, so SSR always takes
 * the unauthenticated branch and emits an empty shell. Without hydration the
 * client used to throw that away and re-render; with hydration enabled it is
 * kept, and the admin area renders blank. Marking these routes client-only
 * removes the divergence at its source rather than teaching the guard to lie
 * about being authenticated. It also stops the server issuing GraphQL requests
 * it has no credentials for.
 *
 * `/login` is client-rendered for the same reason: it is `noindex`, entirely
 * interactive, and its passkey stage depends on browser-only APIs.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];

import 'reflect-metadata'; // Must be first import for tsyringe
// Must precede any import that pulls in graphql-yoga: whatwg-node captures the
// `Event` constructor at module scope, and Angular's domino DOM shim has
// replaced it by now.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';

import bootstrap from './main.server';
import { restoreNativeEvent } from './restore-native-event';
import { initializeContainer } from './server/container';
import { createYogaMiddleware } from './server/graphql/yoga';
import githubRoutes from './server/routes/github';
import sitemapRoutes from './server/routes/sitemap';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  // Initialize dependency injection container
  initializeContainer();

  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  // Hostnames permitted in the request Host header. Without this, @angular/ssr
  // rejects every host (including localhost) as a host-poisoning guard and
  // silently falls back to client-side rendering. Override via SSR_ALLOWED_HOSTS
  // (comma-separated) for other deploy targets. Matching is on hostname only
  // (port stripped); "*.quinnjr.dev" covers www and any subdomain.
  const allowedHosts = (
    process.env['SSR_ALLOWED_HOSTS'] ?? 'quinnjr.dev,*.quinnjr.dev,localhost,127.0.0.1'
  )
    .split(',')
    .map(host => host.trim())
    .filter(Boolean);

  const commonEngine = new CommonEngine({ allowedHosts });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Liveness/readiness probe. Answered directly by Express before the Angular
  // SSR handler, so it bypasses CommonEngine's host validation — App Platform
  // probes the container on an internal IP that the SSR allowedHosts check
  // would otherwise reject. Keeps allowedHosts restrictive for real requests.
  server.get('/healthz', (_req, res) => {
    res.status(200).send('ok');
  });

  // Parse JSON bodies
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // API Routes
  server.use('/api/github', githubRoutes);

  // GraphQL API (Yoga). Mounted before the Angular catch-all.
  const yoga = createYogaMiddleware();
  server.use(yoga.graphqlEndpoint, ((req, res, next) => {
    // Yoga aborts the request's AbortController from a `close` listener, and
    // that abort constructs an `Event` from whatever the global currently is.
    // An SSR render between this request starting and the socket closing will
    // have swapped in Angular's domino DOM constructor, which Node's native
    // EventTarget rejects — an uncaught throw that kills the process.
    // Prepending our listener means the global is native again before Yoga's
    // own `close` handler runs.
    res.prependListener('close', restoreNativeEvent);
    restoreNativeEvent();
    return (yoga as unknown as express.RequestHandler)(req, res, next);
  }) as express.RequestHandler);

  // SEO Routes (sitemap, robots.txt)
  server.use('/', sitemapRoutes);

  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(browserDistFolder, {
      maxAge: '1y',
    })
  );

  // Authenticated and interactive routes are client-rendered.
  //
  // `authGuard` decides from a token in `localStorage`, which does not exist on
  // the server, so SSR always takes the unauthenticated branch and emits an
  // empty shell. Client hydration then keeps that empty DOM instead of
  // re-rendering over it, leaving the admin area blank. Serving the CSR shell
  // removes the divergence at its source, and stops the server issuing GraphQL
  // requests it holds no credentials for.
  //
  // This mirrors `src/app/app.routes.server.ts`, which expresses the same
  // policy for the modern `AngularNodeAppEngine`; `CommonEngine` (used below)
  // does not consult that config, so the split is enforced here as well.
  const csrShell = join(browserDistFolder, 'index.csr.html');
  server.get(/^\/(admin|login)(\/|$)/, (_req, res, next) => {
    res.sendFile(csrShell, (err: unknown) => {
      if (err) {
        next(err);
      }
    });
  });

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html: string) => res.send(html))
      .catch((err: unknown) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] ?? '4000';

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Only bind a port when this module is the process entrypoint. `app()` is
// exported for serverless adapters, which import it and own the listener
// themselves; an unconditional `run()` meant merely importing this module also
// took PORT, which either fights the adapter or crashes on EADDRINUSE.
if (isMainModule(import.meta.url)) {
  run();
}

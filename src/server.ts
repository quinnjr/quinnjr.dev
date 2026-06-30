import 'reflect-metadata'; // Must be first import for tsyringe
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';

import bootstrap from './main.server';
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

  // Parse JSON bodies
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // API Routes
  server.use('/api/github', githubRoutes);

  // GraphQL API (Yoga). Mounted before the Angular catch-all.
  const yoga = createYogaMiddleware();
  server.use(yoga.graphqlEndpoint, yoga as unknown as express.RequestHandler);

  // SEO Routes (sitemap, robots.txt)
  server.use('/', sitemapRoutes);

  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(browserDistFolder, {
      maxAge: '1y',
    })
  );

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

run();

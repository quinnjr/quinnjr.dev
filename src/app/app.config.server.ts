import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideApollo } from 'apollo-angular';

import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { GRAPHQL_URI, serverApolloOptionsFactory } from './graphql/apollo.config';
import { FlowbiteService } from './services/flowbite.service';

// Server-side application config (SSR).
export const config: ApplicationConfig = {
  providers: [
    // Zoneless, matching the browser config. The render loop waits on
    // `ApplicationRef.whenStable()`, which resolves off `PendingTasks` rather
    // than off zone.js's microtask queue going quiet.
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideNoopAnimations(), // Use noop animations for SSR
    // The default fetch backend, which is what Angular recommends under SSR.
    // Requests made during a render are tracked as `PendingTasks`, so the
    // render still waits for them; that stability signal is what keeps SSR
    // output complete.
    provideHttpClient(withInterceptorsFromDi()),
    provideServerRendering(withRoutes(serverRoutes)),
    provideApollo(serverApolloOptionsFactory),
    {
      provide: GRAPHQL_URI,
      useValue: `http://localhost:${process.env['PORT'] ?? '4000'}/graphql`,
    },
    FlowbiteService,
    // Auth is token-based; SSR runs anonymous (no token available server-side).
  ],
};

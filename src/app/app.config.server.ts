import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideServerRendering } from '@angular/platform-server';
import { provideRouter } from '@angular/router';
import { provideApollo } from 'apollo-angular';

import { routes } from './app.routes';
import { apolloOptionsFactory, GRAPHQL_URI } from './graphql/apollo.config';
import { FlowbiteService } from './services/flowbite.service';

// Server-side application config (SSR).
export const config: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNoopAnimations(), // Use noop animations for SSR
    provideHttpClient(withInterceptorsFromDi()),
    provideServerRendering(),
    provideApollo(apolloOptionsFactory),
    {
      provide: GRAPHQL_URI,
      useValue: `http://localhost:${process.env['PORT'] ?? '4000'}/graphql`,
    },
    FlowbiteService,
    // Auth is token-based; SSR runs anonymous (no token available server-side).
  ],
};

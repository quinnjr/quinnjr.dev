import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideApollo } from 'apollo-angular';

import { routes } from './app.routes';
import { apolloOptionsFactory } from './graphql/apollo.config';
import { authInterceptor } from './interceptors/auth.interceptor';
import { FlowbiteService } from './services/flowbite.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    provideAnimations(),
    // Hydrate the SSR markup in place instead of destroying and re-rendering
    // it; event replay covers clicks that land before hydration finishes.
    provideClientHydration(withEventReplay()),
    // `withXhr()` overrides Angular's default fetch backend: Zone.js patches
    // XHR, so in-flight requests keep the application stable for hydration and
    // for SSR's "is the app quiet yet" check in a way fetch does not.
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideApollo(apolloOptionsFactory),
    FlowbiteService,
  ],
};

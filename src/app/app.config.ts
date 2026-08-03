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
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideApollo(apolloOptionsFactory),
    FlowbiteService,
  ],
};

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
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
    // Zoneless: change detection is driven by signal writes, template/host
    // listeners and `markForCheck`, not by zone.js patching every async API.
    // Every component here is OnPush and every piece of mutable view state is a
    // signal, so the notification sources line up with what the app already does.
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    provideAnimations(),
    // Hydrate the SSR markup in place instead of destroying and re-rendering
    // it; event replay covers clicks that land before hydration finishes.
    provideClientHydration(withEventReplay()),
    // The default fetch backend. Stability for hydration and for SSR's "is the
    // app quiet yet" check comes from `PendingTasks`, which `HttpClient`
    // registers per request regardless of backend — it does not depend on
    // zone.js having patched XHR.
    provideHttpClient(withInterceptors([authInterceptor])),
    provideApollo(apolloOptionsFactory),
    FlowbiteService,
  ],
};

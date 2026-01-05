import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';

import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { FlowbiteService } from './services/flowbite.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([authInterceptor])),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        ...environment.auth0.authorizationParams,
        audience: environment.auth0.audience, // Auth0 API identifier
      },
      httpInterceptor: environment.auth0.httpInterceptor,
    }),
    FlowbiteService,
  ],
};

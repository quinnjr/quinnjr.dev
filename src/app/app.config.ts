import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { apolloOptionsFactory } from './graphql/apollo.config';
import { authInterceptor } from './interceptors/auth.interceptor';
import { FlowbiteService } from './services/flowbite.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideApollo(apolloOptionsFactory),
    provideCharts(withDefaultRegisterables()),
    FlowbiteService,
  ],
};

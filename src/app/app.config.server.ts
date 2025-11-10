import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideServerRendering } from '@angular/platform-server';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { FlowbiteService } from './services/flowbite.service';

// Server config WITHOUT Auth0 to avoid SSR issues with location/window access
export const config: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNoopAnimations(), // Use noop animations for SSR
    provideHttpClient(withInterceptorsFromDi()),
    provideServerRendering(),
    FlowbiteService,
    // Auth0 is intentionally excluded from SSR - it will be provided only in browser
  ],
};

import { type Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { CHAPTERS } from './chapters';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./slm-layout.component').then(m => m.SlmLayoutComponent),
    // Chart.js is only used by the Evidence chapter, so it is registered
    // here rather than in the root app config to keep it out of the
    // eagerly-loaded initial bundle.
    providers: [provideCharts(withDefaultRegisterables())],
    children: [
      ...CHAPTERS.map(chapter => ({
        path: chapter.slug,
        loadComponent: chapter.load,
      })),
      {
        path: '',
        redirectTo: CHAPTERS[0].slug,
        pathMatch: 'full' as const,
      },
    ],
  },
];

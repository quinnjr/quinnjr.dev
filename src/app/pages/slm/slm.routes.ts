import { type Routes } from '@angular/router';

import { CHAPTERS } from './chapters';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./slm-layout.component').then(m => m.SlmLayoutComponent),
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

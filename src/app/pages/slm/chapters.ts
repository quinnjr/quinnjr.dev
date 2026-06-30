import { type Type } from '@angular/core';

/**
 * Single source of truth for the SLM grimoire's chapters. Drives the routes,
 * the table of contents, and prev/next navigation. To add a chapter: create a
 * component under ./chapters/ and append an entry here.
 */
export interface Chapter {
  slug: string;
  title: string;
  load: () => Promise<Type<unknown>>;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    slug: 'preamble',
    title: 'Preamble',
    load: () => import('./chapters/preamble.component').then(m => m.PreambleComponent),
  },
  {
    slug: 'principles',
    title: 'Principles',
    load: () => import('./chapters/principles.component').then(m => m.PrinciplesComponent),
  },
  {
    slug: 'practice',
    title: 'Practice',
    load: () => import('./chapters/practice.component').then(m => m.PracticeComponent),
  },
];

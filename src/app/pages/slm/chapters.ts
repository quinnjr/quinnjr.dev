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
    slug: 'introduction',
    title: 'Introduction',
    load: () => import('./chapters/introduction.component').then(m => m.IntroductionComponent),
  },
  {
    slug: 'definitions',
    title: 'Definitions',
    load: () => import('./chapters/definitions.component').then(m => m.DefinitionsComponent),
  },
  {
    slug: 'evidence',
    title: 'Evidence',
    load: () => import('./chapters/evidence.component').then(m => m.EvidenceComponent),
  },
  {
    slug: 'costs',
    title: 'Costs',
    load: () => import('./chapters/costs.component').then(m => m.CostsComponent),
  },
  {
    slug: 'backlash',
    title: 'Backlash',
    load: () => import('./chapters/backlash.component').then(m => m.BacklashComponent),
  },
  {
    slug: 'overkill',
    title: 'Overkill',
    load: () => import('./chapters/overkill.component').then(m => m.OverkillComponent),
  },
];

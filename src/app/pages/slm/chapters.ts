import { type Type } from '@angular/core';

/**
 * Single source of truth for the SLM grimoire's chapters. Drives the routes,
 * the table of contents, and prev/next navigation. To add a chapter: create a
 * component under ./chapters/ and append an entry here.
 */
export interface Chapter {
  slug: string;
  title: string;
  /**
   * Meta description for the chapter's own URL. Each chapter is a separately
   * indexable page, so these must be distinct — a shared description makes the
   * six read as duplicates of one another.
   */
  description: string;
  load: () => Promise<Type<unknown>>;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    slug: 'introduction',
    title: 'Introduction',
    description:
      'The case against scale as a strategy: why the pursuit of artificial general intelligence misallocates capital, talent, and electricity, and why small language models are the better instrument for nearly all real work.',
    load: () => import('./chapters/introduction.component').then(m => m.IntroductionComponent),
  },
  {
    slug: 'definitions',
    title: 'Definitions',
    description:
      'Plain, exact definitions of the terms this argument turns on — large language model, small language model, parameters, inference cost, and fine-tuning — fixed in place before the case continues.',
    load: () => import('./chapters/definitions.component').then(m => m.DefinitionsComponent),
  },
  {
    slug: 'evidence',
    title: 'Evidence',
    description:
      'The empirical test: open-weight labs running on less capital and export-throttled chips, measured against Anthropic, OpenAI, and Google on the same public benchmarks — and what the results say about the trillion-parameter thesis.',
    load: () => import('./chapters/evidence.component').then(m => m.EvidenceComponent),
  },
  {
    slug: 'costs',
    title: 'Costs',
    description:
      'The physical plant beneath the industry: list prices for servers and racks, the capital cost of a datacenter megawatt, cooling, and storage — the economics of frontier-scale AI counted from the hardware up.',
    load: () => import('./chapters/costs.component').then(m => m.CostsComponent),
  },
  {
    slug: 'backlash',
    title: 'Backlash',
    description:
      'The human case, made from polling, layoff data, and court records rather than argument: where frontier AI was sold as a substitute for skilled judgment, how it failed publicly, and where judges imposed sanctions.',
    load: () => import('./chapters/backlash.component').then(m => m.BacklashComponent),
  },
  {
    slug: 'overkill',
    title: 'Overkill',
    description:
      'Why coding agents like Claude Code and Codex run on general trillion-parameter models rather than coding models, what that costs the developer typing shell commands, and what a purpose-built alternative would look like.',
    load: () => import('./chapters/overkill.component').then(m => m.OverkillComponent),
  },
];

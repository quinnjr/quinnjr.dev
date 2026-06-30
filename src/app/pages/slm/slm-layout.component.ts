import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { NavigationComponent } from '../../components/navigation/navigation.component';

import { CHAPTERS } from './chapters';

@Component({
  selector: 'app-slm-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavigationComponent],
  templateUrl: './slm-layout.component.html',
  styleUrl: './slm-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlmLayoutComponent {
  private readonly router = inject(Router);

  public readonly chapters = CHAPTERS;

  // Current chapter slug, kept in sync with the active child route.
  private readonly currentSlug = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.slugFromUrl()),
      startWith(this.slugFromUrl())
    ),
    { initialValue: this.slugFromUrl() }
  );

  private readonly index = computed(() => CHAPTERS.findIndex(c => c.slug === this.currentSlug()));

  public readonly prev = computed(() => CHAPTERS[this.index() - 1] ?? null);
  public readonly next = computed(() => CHAPTERS[this.index() + 1] ?? null);

  private slugFromUrl(): string {
    // .../slm/<slug> — last non-empty path segment.
    return this.router.url.split('?')[0].split('/').filter(Boolean).pop() ?? '';
  }
}

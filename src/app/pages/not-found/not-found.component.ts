import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../services/seo.service';

/**
 * Terminal `**` route inside the app shell. Without it an unknown URL matched
 * the shell with an empty outlet and the server still answered 200 — a soft
 * 404 that crawlers index as a thin duplicate of the shell. `noIndex` keeps
 * those URLs out of the index while the nav and footer stay in place.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tavern-shell">
      <div class="container mx-auto max-w-2xl px-4 py-24 text-center">
        <p class="tavern-eyebrow">Lost the trail</p>
        <h1 class="mt-3 font-medieval text-5xl text-parchment">404 — No such path</h1>
        <div class="card-stone clip-rpg mt-10 p-10">
          <i class="fas fa-signs-post mb-4 text-5xl text-amber" aria-hidden="true"></i>
          <p class="mx-auto max-w-lg font-body text-muted">
            This road leads nowhere on the map. The page may have been moved, renamed, or never
            written at all.
          </p>
          <a routerLink="/home" class="btn-rpg btn-rpg-primary mt-8">
            <i class="fas fa-house" aria-hidden="true"></i> Back to the hearth
          </a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Page not found',
      description: 'This road leads nowhere on the map — the page you asked for does not exist.',
      noIndex: true,
    });
  }
}

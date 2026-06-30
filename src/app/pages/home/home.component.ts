import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ScrollRevealService } from '../../services/scroll-reveal.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private scrollReveal = inject(ScrollRevealService);

  ngAfterViewInit(): void {
    // Only run in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      // Reveal the "Systems & Abilities" / "Commendations" sections on scroll.
      this.host.nativeElement
        .querySelectorAll('.reveal-target')
        .forEach(el => this.scrollReveal.observe(el));
      this.renderCredlyBadges();
    }
  }

  /**
   * Render the Credly "Commendations" badges.
   *
   * The Credly embed script scans the DOM for `[data-share-badge-id]` elements
   * when it first loads. In this SPA those elements mount *after* that initial
   * scan (on route render), so the badges stay empty. The embed exposes no
   * callable init API — only a `CREDLY_EMBED_JS_LOADER_VERSION` global — so the
   * reliable way to render dynamically-added badges is to re-inject the script,
   * which triggers a fresh scan that fills them in.
   */
  private renderCredlyBadges(): void {
    const src = 'https://cdn.credly.com/assets/utilities/embed.js';
    document
      .querySelectorAll('script[src*="credly.com/assets/utilities/embed.js"]')
      .forEach(s => s.remove());
    const script = document.createElement('script');
    script.src = `${src}?_=${Date.now()}`;
    script.async = true;
    document.body.appendChild(script);
  }
}

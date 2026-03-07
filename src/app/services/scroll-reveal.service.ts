import { isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';

/**
 * ScrollRevealService uses IntersectionObserver to add a `.revealed` class to
 * elements when they enter the viewport. Components call `observe(element)` in
 * AfterViewInit and the service handles the rest. No third-party animation
 * library required — CSS transitions keyed on `.revealed` do the work.
 */
@Injectable({ providedIn: 'root' })
export class ScrollRevealService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              // Unobserve after reveal so it fires only once
              this.observer?.unobserve(entry.target);
            }
          }
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -40px 0px',
        }
      );
    }
  }

  /**
   * Start observing an element. Add `reveal-target` (and optionally
   * `reveal-delay-N`) classes to the element in the template; this service
   * appends `revealed` when it scrolls into view.
   */
  observe(el: Element): void {
    this.observer?.observe(el);
  }

  /** Unobserve a specific element (call in ngOnDestroy of short-lived components). */
  unobserve(el: Element): void {
    this.observer?.unobserve(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

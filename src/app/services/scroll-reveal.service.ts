import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';

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
   *
   * The service is root-scoped, so its own `ngOnDestroy` only runs at app
   * teardown — an element observed and never unobserved keeps its detached DOM
   * alive for the whole session. Pass the caller's `DestroyRef` (recommended)
   * to have the element unobserved automatically, or invoke the returned
   * teardown function yourself.
   */
  observe(el: Element, destroyRef?: DestroyRef): () => void {
    this.observer?.observe(el);
    const teardown = (): void => {
      this.observer?.unobserve(el);
    };
    destroyRef?.onDestroy(teardown);
    return teardown;
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

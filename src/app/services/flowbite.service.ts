import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FlowbiteService {
  private platformId = inject(PLATFORM_ID);
  /** Memoized so repeat callers share one dynamic import rather than re-entering it. */
  private flowbite: Promise<unknown> | null = null;

  public loadFlowbite(callback: (flowbite: unknown) => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.flowbite ??= import('flowbite');
    this.flowbite.then(callback).catch((error: unknown) => {
      // Drop the memo so a transient chunk-load failure can be retried, and
      // surface it — a silent failure leaves Flowbite widgets inert with no clue.
      this.flowbite = null;
      console.error('Failed to load Flowbite:', error);
    });
  }
}

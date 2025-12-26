import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  CardBodyComponent,
  BadgeComponent,
} from '../../shared/components/ui';

// Interface for window with Credly
interface WindowWithCredly extends Window {
  CredlyBadge?: {
    init: () => void;
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ButtonComponent, CardComponent, CardBodyComponent, BadgeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    // Only run in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      // Reinitialize Credly badges after view is loaded
      this.loadCredlyBadges();
    }
  }

  private loadCredlyBadges(retryCount = 0): void {
    // Check if Credly script is loaded
    const windowWithCredly = window as WindowWithCredly;
    if (typeof window !== 'undefined' && windowWithCredly.CredlyBadge) {
      try {
        // Trigger badge rendering
        windowWithCredly.CredlyBadge.init();
      } catch {
        // Silently fail - badges will not render
      }
    } else if (retryCount < 50) {
      // If script not loaded yet, wait and try again (max 5 seconds)
      setTimeout(() => {
        this.loadCredlyBadges(retryCount + 1);
      }, 100);
    }
  }
}

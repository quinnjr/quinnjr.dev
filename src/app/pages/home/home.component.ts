import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';

// Interface for window with Credly
interface WindowWithCredly extends Window {
  CredlyBadge?: {
    init: () => void;
  };
}

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

  ngAfterViewInit(): void {
    // Only run in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      // Reinitialize Credly badges after view is loaded
      this.loadCredlyBadges();
    }
  }

  private loadCredlyBadges(): void {
    // Check if Credly script is loaded
    const windowWithCredly = window as WindowWithCredly;
    if (typeof window !== 'undefined' && windowWithCredly.CredlyBadge) {
      // Trigger badge rendering
      windowWithCredly.CredlyBadge.init();
    } else {
      // If script not loaded yet, wait and try again
      setTimeout(() => {
        this.loadCredlyBadges();
      }, 100);
    }
  }
}

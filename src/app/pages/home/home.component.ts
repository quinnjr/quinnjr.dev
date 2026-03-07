import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { TavernSceneComponent } from '../../components/tavern-scene/tavern-scene.component';
import { ScrollRevealService } from '../../services/scroll-reveal.service';

interface WindowWithCredly extends Window {
  CredlyBadge?: {
    init: () => void;
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TavernSceneComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly scrollReveal = inject(ScrollRevealService);

  @ViewChildren('revealTarget') revealTargets!: QueryList<ElementRef<Element>>;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Wire up scroll reveal for all marked elements
    this.revealTargets.forEach(ref => {
      this.scrollReveal.observe(ref.nativeElement);
    });

    this.loadCredlyBadges();
  }

  private loadCredlyBadges(retryCount = 0): void {
    const windowWithCredly = window as WindowWithCredly;
    if (typeof window !== 'undefined' && windowWithCredly.CredlyBadge) {
      try {
        windowWithCredly.CredlyBadge.init();
      } catch {
        // Silently fail — badges will not render
      }
    } else if (retryCount < 50) {
      setTimeout(() => {
        this.loadCredlyBadges(retryCount + 1);
      }, 100);
    }
  }
}

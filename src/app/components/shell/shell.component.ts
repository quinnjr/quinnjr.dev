import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from '../footer/footer.component';
import { NavigationComponent } from '../navigation/navigation.component';

/**
 * Application shell for all standard content — everything that isn't the SLM
 * manifesto or the admin panel, which carry their own layouts. Wraps the routed
 * outlet in the shared navbar and footer so pages don't repeat the site chrome.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-naviation />
    <main id="main-content" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class ShellComponent {}

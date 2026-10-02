import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthButtonComponent } from '../../../components/auth-button/auth-button.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AuthButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh">
      <!-- Admin Header -->
      <header class="border-b border-amber/25 bg-panel/90 backdrop-blur-sm">
        <div
          class="container mx-auto flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <a
              routerLink="/admin"
              class="admin-nav-brand inline-flex items-center gap-2 font-medieval text-xl text-parchment"
            >
              <i class="fas fa-shield-halved text-amber" aria-hidden="true"></i>Admin Console
            </a>
            <!--
              Only routes declared under the admin path in app.routes.ts belong here.
              Projects/Settings links used to live here and threw
              "Cannot match any routes" because no such child route exists.
            -->
            <nav aria-label="Admin" class="-mx-1 flex gap-1 overflow-x-auto">
              <a
                routerLink="/admin"
                routerLinkActive="is-active"
                [routerLinkActiveOptions]="{ exact: true }"
                ariaCurrentWhenActive="page"
                class="admin-nav-link"
              >
                <i class="fas fa-gauge" aria-hidden="true"></i>Dashboard
              </a>
              <a
                routerLink="/admin/articles"
                routerLinkActive="is-active"
                ariaCurrentWhenActive="page"
                class="admin-nav-link"
              >
                <i class="fas fa-scroll" aria-hidden="true"></i>Articles
              </a>
              <a
                routerLink="/admin/security"
                routerLinkActive="is-active"
                ariaCurrentWhenActive="page"
                class="admin-nav-link"
              >
                <i class="fas fa-fingerprint" aria-hidden="true"></i>Security
              </a>
            </nav>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/" class="link-tavern text-sm">
              <i class="fas fa-arrow-up-right-from-square mr-1" aria-hidden="true"></i>View site
            </a>
            <app-auth-button></app-auth-button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-nav-brand:focus-visible,
      .admin-nav-link:focus-visible {
        outline: 2px solid var(--color-amber-bright);
        outline-offset: 2px;
      }

      .admin-nav-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 2.75rem;
        padding: 0 0.55rem;
        white-space: nowrap;
        font-family: var(--font-heading);
        font-size: 0.85rem;
        letter-spacing: 0.06em;
        color: var(--color-parchment);
        border-bottom: 1px solid transparent;
        transition:
          color 0.2s var(--ease-gilt),
          border-color 0.2s var(--ease-gilt);
      }

      .admin-nav-link i {
        color: var(--color-muted);
        transition: color 0.2s var(--ease-gilt);
      }

      .admin-nav-link:hover,
      .admin-nav-link:hover i,
      .admin-nav-link.is-active,
      .admin-nav-link.is-active i {
        color: var(--color-amber);
      }

      .admin-nav-link.is-active {
        border-bottom-color: var(--color-amber);
      }

      @media (min-width: 768px) {
        .admin-nav-link {
          padding: 0 0.85rem;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent {}

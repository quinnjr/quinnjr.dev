import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GitHubRepository, GitHubService } from '../../services/github.service';
import { absoluteUrl } from '../../services/seo.config';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent implements OnInit {
  private githubService = inject(GitHubService);
  private seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  repositories = signal<GitHubRepository[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  /**
   * Card view-model. `getIconForRepo` walks a long string-matching chain and
   * `getDisplayName` allocates per call; binding them directly in the `@for`
   * re-ran both for every card on every change-detection pass.
   */
  readonly cards = computed(() =>
    this.repositories().map(repo => ({
      ...repo,
      icon: this.getIconForRepo(repo),
      displayName: this.getDisplayName(repo.name),
    }))
  );

  ngOnInit(): void {
    this.applySeo();
    this.loadRepositories();
  }

  private applySeo(): void {
    this.seo.apply({
      title: 'Projects — Open-Source Work by Joseph R. Quinn',
      description:
        'Open-source projects by Joseph R. Quinn, spanning Rust and Go systems tools, MCP servers, Angular libraries, bioinformatics utilities, and developer tooling.',
      path: '/projects',
      keywords: [
        'Joseph R. Quinn projects',
        'open source Rust projects',
        'MCP servers',
        'Angular open source',
      ],
    });

    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/home' },
      { name: 'Projects', path: '/projects' },
    ]);

    // Claim the `page` key immediately. `setJsonLd` replaces by key, so until
    // this runs the previous route's graph (e.g. Home's ProfilePage) still
    // describes this URL — permanently so if the GitHub fetch then fails.
    this.publishItemList([]);
  }

  private loadRepositories(): void {
    // Tied to the component lifetime: navigating away before the fetch lands
    // would otherwise still run `publishItemList`, overwriting the JSON-LD the
    // newly-active route just published.
    this.githubService
      .getRepositories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: repos => {
          this.repositories.set(repos);
          this.loading.set(false);
          this.publishItemList(repos);
        },
        error: err => {
          console.error('Failed to load repositories:', err);
          this.error.set('Failed to load projects from GitHub');
          this.loading.set(false);
        },
      });
  }

  /**
   * Publishes the repository grid as an ItemList so the page is legible as a
   * list of named works rather than an opaque card layout. Emitted after the
   * GitHub fetch resolves, which under SSR is before the HTML is serialised.
   */
  private publishItemList(repos: GitHubRepository[]): void {
    this.seo.setJsonLd('page', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': absoluteUrl('/projects'),
      url: absoluteUrl('/projects'),
      name: 'Projects — Open-Source Work by Joseph R. Quinn',
      inLanguage: 'en-US',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: repos.length,
        itemListElement: repos.map((repo, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'SoftwareSourceCode',
            name: this.getDisplayName(repo.name),
            description: repo.description ?? undefined,
            codeRepository: repo.url,
            programmingLanguage: repo.primaryLanguage?.name ?? undefined,
            author: { '@type': 'Person', name: 'Joseph R. Quinn' },
          },
        })),
      },
    });
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  getIconForRepo(repo: GitHubRepository): string {
    const name = repo.name.toLowerCase();
    const desc = (repo.description ?? '').toLowerCase();
    const lang = repo.primaryLanguage?.name ?? '';

    // Music/Audio related
    if (name.includes('mcp') || desc.includes('mcp')) {
      if (name.includes('fruity')) {
        return 'fa-music';
      }
      if (name.includes('lmms')) {
        return 'fa-headphones';
      }
      if (name.includes('guitar')) {
        return 'fa-guitar';
      }
    }

    // Database/Storage
    if (name.includes('indexeddb') || desc.includes('database')) {
      return 'fa-database';
    }

    // Mobile/Device
    if (name.includes('mtp') || name.includes('itunes')) {
      return 'fa-mobile-alt';
    }

    // Games
    if (name.includes('game') || name.includes('tic-tac-toe')) {
      return 'fa-gamepad';
    }
    if (desc.includes('puzzle')) {
      return 'fa-puzzle-piece';
    }

    // Science/Research
    if (name.includes('pluma') || desc.includes('bioinformatics')) {
      return 'fa-dna';
    }

    // UI/Framework
    if (name.includes('bulma') || name.includes('angular')) {
      return 'fa-layer-group';
    }
    if (name.includes('flutter')) {
      return 'fa-mobile';
    }

    // API/Client
    if (name.includes('apollo') || desc.includes('graphql')) {
      return 'fa-project-diagram';
    }
    if (name.includes('yubikey')) {
      return 'fa-key';
    }

    // System/Config
    if (name.includes('dotfiles')) {
      return 'fa-terminal';
    }
    if (name.includes('aur')) {
      return 'fa-box';
    }
    if (name.includes('docker')) {
      return 'fa-docker';
    }
    if (name.includes('nginx')) {
      return 'fa-server';
    }

    // Algorithms/Performance
    if (name.includes('cuda') || desc.includes('cuda')) {
      return 'fa-microchip';
    }
    if (desc.includes('algorithm') || name.includes('floyd')) {
      return 'fa-diagram-project';
    }
    if (name.includes('travelling') || name.includes('salesman')) {
      return 'fa-route';
    }

    // Language-based defaults
    if (lang === 'Rust') {
      return 'fa-cog';
    }
    if (lang === 'Go') {
      return 'fa-code';
    }
    if (lang === 'Python') {
      return 'fa-python';
    }
    if (lang === 'Dart') {
      return 'fa-mobile';
    }
    if (lang === 'Shell') {
      return 'fa-terminal';
    }

    return 'fa-code';
  }

  getDisplayName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { GitHubRepository, GitHubService } from '../../services/github.service';

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

  repositories = signal<GitHubRepository[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRepositories();
  }

  private loadRepositories(): void {
    this.githubService.getRepositories().subscribe({
      next: repos => {
        this.repositories.set(repos);
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load repositories:', err);
        this.error.set('Failed to load projects from GitHub');
        this.loading.set(false);
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  getColorForRepo(repo: GitHubRepository): string {
    const name = repo.name.toLowerCase();
    const lang = repo.primaryLanguage?.name ?? '';

    // Specific project colors
    if (name.includes('fruity') || name.includes('mcp')) {
      return 'purple';
    }
    if (name.includes('indexeddb')) {
      return 'pink';
    }
    if (name.includes('guitar')) {
      return 'green';
    }
    if (name.includes('itunes') || name.includes('mtp')) {
      return 'orange';
    }
    if (name.includes('game')) {
      return 'cyan';
    }
    if (name.includes('pluma')) {
      return 'yellow';
    }
    if (name.includes('bulma')) {
      return 'teal';
    }
    if (name.includes('apollo')) {
      return 'violet';
    }
    if (name.includes('dotfiles')) {
      return 'lime';
    }
    if (name.includes('cuda')) {
      return 'red';
    }

    // Language-based colors
    if (lang === 'TypeScript' || lang === 'JavaScript') {
      return 'blue';
    }
    if (lang === 'Rust') {
      return 'orange';
    }
    if (lang === 'Python') {
      return 'yellow';
    }
    if (lang === 'Go') {
      return 'cyan';
    }
    if (lang === 'PHP') {
      return 'violet';
    }
    if (lang === 'Shell') {
      return 'green';
    }
    if (lang === 'Dart') {
      return 'sky';
    }

    return 'gray';
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

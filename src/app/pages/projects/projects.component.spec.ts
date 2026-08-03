import { HttpClient, withXhr, provideHttpClient } from '@angular/common/http';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { type GitHubRepository } from '../../services/github.service';

import { ProjectsComponent } from './projects.component';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let httpClient: HttpClient;

  const mockRepositories: GitHubRepository[] = [
    {
      name: 'mcp-fruity',
      description: 'A music project',
      url: 'https://github.com/quinnjr/mcp-fruity',
      stargazerCount: 5,
      primaryLanguage: { name: 'TypeScript' },
      pushedAt: '2024-01-01',
      isPrivate: false,
      isFork: false,
    },
    {
      name: 'indexeddb-wrapper',
      description: 'Database wrapper',
      url: 'https://github.com/quinnjr/indexeddb-wrapper',
      stargazerCount: 3,
      primaryLanguage: { name: 'JavaScript' },
      pushedAt: '2024-01-02',
      isPrivate: false,
      isFork: false,
    },
    {
      name: 'dotfiles',
      description: 'Config files',
      url: 'https://github.com/quinnjr/dotfiles',
      stargazerCount: 1,
      primaryLanguage: { name: 'Shell' },
      pushedAt: '2024-01-03',
      isPrivate: false,
      isFork: false,
    },
    {
      name: 'cuda-algorithm',
      description: 'CUDA implementation',
      url: 'https://github.com/quinnjr/cuda-algorithm',
      stargazerCount: 0,
      primaryLanguage: { name: 'Rust' },
      pushedAt: '2024-01-04',
      isPrivate: false,
      isFork: false,
    },
    {
      name: 'pluma-bio',
      description: 'Bioinformatics tool',
      url: 'https://github.com/quinnjr/pluma-bio',
      stargazerCount: 0,
      primaryLanguage: { name: 'Python' },
      pushedAt: '2024-01-05',
      isPrivate: false,
      isFork: false,
    },
    {
      name: 'unknown-project',
      description: 'Generic project',
      url: 'https://github.com/quinnjr/unknown-project',
      stargazerCount: 0,
      primaryLanguage: { name: 'Go' },
      pushedAt: '2024-01-06',
      isPrivate: false,
      isFork: false,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [provideHttpClient(withXhr())],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    httpClient = TestBed.inject(HttpClient);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Repository Loading', () => {
    it('should load repositories on init', async () => {
      const spy = vi.spyOn(httpClient, 'get').mockReturnValue(of({ data: mockRepositories }));

      fixture.detectChanges(); // Triggers ngOnInit

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalledWith('/api/github/repositories');
      expect(component.repositories().length).toBe(6);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should handle error when loading repositories fails', async () => {
      const spy = vi
        .spyOn(httpClient, 'get')
        .mockReturnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges(); // Triggers ngOnInit

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalledWith('/api/github/repositories');
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Failed to load projects from GitHub');
    });
  });

  describe('JSON-LD', () => {
    function pageGraph(): Record<string, unknown> | null {
      const script = document.head.querySelector('script[data-seo-jsonld="page"]');
      return script?.textContent ? JSON.parse(script.textContent) : null;
    }

    afterEach(() => {
      document.head.querySelector('script[data-seo-jsonld="page"]')?.remove();
    });

    it('describes the page as a CollectionPage once loaded', async () => {
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ data: mockRepositories }));

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 100));

      const graph = pageGraph();
      expect(graph?.['@type']).toBe('CollectionPage');
      expect((graph?.['mainEntity'] as { numberOfItems: number }).numberOfItems).toBe(6);
    });

    // Regression: on the error path the CollectionPage was never published, so
    // a client-side nav from Home left that route's ProfilePage graph, under
    // the same `page` key, describing /projects.
    it('still describes the page as a CollectionPage when the fetch fails', async () => {
      vi.spyOn(httpClient, 'get').mockReturnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 100));

      const graph = pageGraph();
      expect(graph?.['@type']).toBe('CollectionPage');
      expect((graph?.['mainEntity'] as { numberOfItems: number }).numberOfItems).toBe(0);
    });
  });

  describe('getIconForRepo', () => {
    it('should return fa-music for mcp music projects', () => {
      const repo: GitHubRepository = {
        name: 'mcp-fruity',
        description: 'Music project',
        url: '',
        stargazerCount: 0,
        primaryLanguage: null,
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-music');
    });

    it('should return fa-database for indexeddb projects', () => {
      const repo: GitHubRepository = {
        name: 'indexeddb-wrapper',
        description: 'Database wrapper',
        url: '',
        stargazerCount: 0,
        primaryLanguage: null,
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-database');
    });

    it('should return fa-terminal for dotfiles', () => {
      const repo: GitHubRepository = {
        name: 'dotfiles',
        description: 'Config files',
        url: '',
        stargazerCount: 0,
        primaryLanguage: null,
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-terminal');
    });

    it('should return fa-microchip for cuda projects', () => {
      const repo: GitHubRepository = {
        name: 'cuda-algorithm',
        description: 'CUDA implementation',
        url: '',
        stargazerCount: 0,
        primaryLanguage: null,
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-microchip');
    });

    it('should return fa-dna for bioinformatics projects', () => {
      const repo: GitHubRepository = {
        name: 'pluma-bio',
        description: 'Bioinformatics tool',
        url: '',
        stargazerCount: 0,
        primaryLanguage: null,
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-dna');
    });

    it('should return fa-cog for Rust projects by default', () => {
      const repo: GitHubRepository = {
        name: 'unknown-rust',
        description: 'Rust project',
        url: '',
        stargazerCount: 0,
        primaryLanguage: { name: 'Rust' },
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-cog');
    });

    it('should return fa-python for Python projects by default', () => {
      const repo: GitHubRepository = {
        name: 'unknown-python',
        description: 'Python project',
        url: '',
        stargazerCount: 0,
        primaryLanguage: { name: 'Python' },
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-python');
    });

    it('should return fa-code for unknown projects', () => {
      const repo: GitHubRepository = {
        name: 'unknown-project',
        description: 'Generic project',
        url: '',
        stargazerCount: 0,
        primaryLanguage: null,
        pushedAt: '',
        isPrivate: false,
        isFork: false,
      };
      expect(component.getIconForRepo(repo)).toBe('fa-code');
    });
  });

  describe('getDisplayName', () => {
    it('should convert kebab-case to Title Case', () => {
      expect(component.getDisplayName('my-awesome-project')).toBe('My Awesome Project');
    });

    it('should convert snake_case to Title Case', () => {
      expect(component.getDisplayName('my_awesome_project')).toBe('My Awesome Project');
    });

    it('should handle mixed separators', () => {
      expect(component.getDisplayName('my-awesome_project')).toBe('My Awesome Project');
    });

    it('should handle single word', () => {
      expect(component.getDisplayName('project')).toBe('Project');
    });

    it('should handle already capitalized words', () => {
      expect(component.getDisplayName('API-wrapper')).toBe('API Wrapper');
    });
  });
});

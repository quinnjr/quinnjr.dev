import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { GitHubRepository, GitHubService } from './github.service';

describe('GitHubService', () => {
  let service: GitHubService;
  let httpClient: HttpClient;

  const mockRepositories: GitHubRepository[] = [
    {
      name: 'test-repo-1',
      description: 'Test repository 1',
      url: 'https://github.com/quinnjr/test-repo-1',
      stargazerCount: 5,
      primaryLanguage: { name: 'TypeScript' },
      pushedAt: '2024-01-01',
      isPrivate: false,
      isFork: false,
    },
    {
      name: 'test-repo-2',
      description: 'Test repository 2',
      url: 'https://github.com/quinnjr/test-repo-2',
      stargazerCount: 3,
      primaryLanguage: { name: 'JavaScript' },
      pushedAt: '2024-01-02',
      isPrivate: false,
      isFork: false,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), GitHubService],
    });
    service = TestBed.inject(GitHubService);
    httpClient = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRepositories', () => {
    it('should fetch repositories successfully', async () => {
      const spy = vi.spyOn(httpClient, 'get').mockReturnValue(of({ data: mockRepositories }));

      const repos = await new Promise<GitHubRepository[]>((resolve, reject) => {
        service.getRepositories().subscribe({
          next: repos => resolve(repos),
          error: err => reject(err),
        });
      });

      expect(repos).toEqual(mockRepositories);
      expect(repos.length).toBe(2);
      expect(spy).toHaveBeenCalledWith('/api/github/repositories');
    });

    it('should handle HTTP error', async () => {
      const errorResponse = new HttpErrorResponse({
        error: 'Test error',
        status: 500,
        statusText: 'Internal Server Error',
      });

      const spy = vi.spyOn(httpClient, 'get').mockReturnValue(throwError(() => errorResponse));

      await expect(
        new Promise((resolve, reject) => {
          service.getRepositories().subscribe({
            next: repos => resolve(repos),
            error: err => reject(err),
          });
        })
      ).rejects.toThrow();
      expect(spy).toHaveBeenCalledWith('/api/github/repositories');
    });

    it('should extract data from API response', async () => {
      const apiResponse = { data: mockRepositories };
      vi.spyOn(httpClient, 'get').mockReturnValue(of(apiResponse));

      const repos = await new Promise<GitHubRepository[]>((resolve, reject) => {
        service.getRepositories().subscribe({
          next: repos => resolve(repos),
          error: err => reject(err),
        });
      });

      expect(repos).toEqual(mockRepositories);
      expect(repos).not.toEqual(apiResponse);
    });

    it('should handle empty repository list', async () => {
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ data: [] }));

      const repos = await new Promise<GitHubRepository[]>((resolve, reject) => {
        service.getRepositories().subscribe({
          next: repos => resolve(repos),
          error: err => reject(err),
        });
      });

      expect(repos).toEqual([]);
      expect(repos.length).toBe(0);
    });
  });
});

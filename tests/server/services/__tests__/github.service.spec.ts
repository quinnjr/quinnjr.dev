import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubService } from '../../../../src/server/services/github.service';

// Mock fetch globally
global.fetch = vi.fn();

describe('GitHubService', () => {
  let service: GitHubService;

  beforeEach(() => {
    service = new GitHubService();
    vi.clearAllMocks();
  });

  describe('getRepositories', () => {
    it('should fetch and transform repositories from GitHub API', async () => {
      const mockRepos = [
        {
          name: 'test-repo',
          description: 'A test repository',
          html_url: 'https://github.com/quinnjr/test-repo',
          stargazers_count: 5,
          language: 'TypeScript',
          pushed_at: '2025-01-01T00:00:00Z',
          private: false,
          fork: false,
        },
        {
          name: 'another-repo',
          description: null,
          html_url: 'https://github.com/quinnjr/another-repo',
          stargazers_count: 0,
          language: null,
          pushed_at: '2024-12-01T00:00:00Z',
          private: false,
          fork: false,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRepos,
      });

      const result = await service.getRepositories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test-repo');
      expect(result[0].description).toBe('A test repository');
      expect(result[0].stargazerCount).toBe(5);
      expect(result[0].primaryLanguage?.name).toBe('TypeScript');
      expect(result[1].primaryLanguage).toBeNull();
    });

    it('should filter out private repositories', async () => {
      const mockRepos = [
        {
          name: 'public-repo',
          description: 'Public',
          html_url: 'https://github.com/quinnjr/public-repo',
          stargazers_count: 0,
          language: 'TypeScript',
          pushed_at: '2025-01-01T00:00:00Z',
          private: false,
          fork: false,
        },
        {
          name: 'private-repo',
          description: 'Private',
          html_url: 'https://github.com/quinnjr/private-repo',
          stargazers_count: 0,
          language: 'TypeScript',
          pushed_at: '2025-01-01T00:00:00Z',
          private: true,
          fork: false,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRepos,
      });

      const result = await service.getRepositories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('public-repo');
    });

    it('should filter out forked repositories', async () => {
      const mockRepos = [
        {
          name: 'original-repo',
          description: 'Original',
          html_url: 'https://github.com/quinnjr/original-repo',
          stargazers_count: 0,
          language: 'TypeScript',
          pushed_at: '2025-01-01T00:00:00Z',
          private: false,
          fork: false,
        },
        {
          name: 'forked-repo',
          description: 'Fork',
          html_url: 'https://github.com/quinnjr/forked-repo',
          stargazers_count: 0,
          language: 'TypeScript',
          pushed_at: '2025-01-01T00:00:00Z',
          private: false,
          fork: true,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRepos,
      });

      const result = await service.getRepositories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('original-repo');
    });

    it('should sort repositories by pushed_at date descending', async () => {
      const mockRepos = [
        {
          name: 'old-repo',
          description: 'Old',
          html_url: 'https://github.com/quinnjr/old-repo',
          stargazers_count: 0,
          language: 'TypeScript',
          pushed_at: '2024-01-01T00:00:00Z',
          private: false,
          fork: false,
        },
        {
          name: 'new-repo',
          description: 'New',
          html_url: 'https://github.com/quinnjr/new-repo',
          stargazers_count: 0,
          language: 'TypeScript',
          pushed_at: '2025-01-01T00:00:00Z',
          private: false,
          fork: false,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRepos,
      });

      const result = await service.getRepositories();

      expect(result[0].name).toBe('new-repo');
      expect(result[1].name).toBe('old-repo');
    });

    it('should throw error when GitHub API fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service.getRepositories()).rejects.toThrow('GitHub API error: Not Found');
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(service.getRepositories()).rejects.toThrow('Network error');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { GitHubService } from '../../../../src/server/services/github.service';

// Mock fetch globally
global.fetch = vi.fn();

interface MockRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  private: boolean;
  fork: boolean;
}

function repo(overrides: Partial<MockRepo> & { name: string }): MockRepo {
  return {
    description: null,
    html_url: `https://github.com/quinnjr/${overrides.name}`,
    stargazers_count: 0,
    language: 'TypeScript',
    pushed_at: '2025-01-01T00:00:00Z',
    private: false,
    fork: false,
    ...overrides,
  };
}

/** Minimal Response stand-in; `nextUrl` becomes a `Link: rel="next"` header. */
function page(repos: MockRepo[], nextUrl?: string) {
  return {
    ok: true,
    json: async () => repos,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'link' && nextUrl ? `<${nextUrl}>; rel="next"` : null,
    },
  };
}

function mockPages(...pages: Array<ReturnType<typeof page>>) {
  const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
  fetchMock.mockReset();
  for (const p of pages) {
    fetchMock.mockResolvedValueOnce(p);
  }
  return fetchMock;
}

describe('GitHubService', () => {
  let service: GitHubService;

  beforeEach(() => {
    service = new GitHubService();
    vi.clearAllMocks();
  });

  describe('getRepositories', () => {
    it('should fetch and transform repositories from GitHub API', async () => {
      mockPages(
        page([
          repo({ name: 'test-repo', description: 'A test repository', stargazers_count: 5 }),
          repo({ name: 'another-repo', language: null, pushed_at: '2024-12-01T00:00:00Z' }),
        ])
      );

      const result = await service.getRepositories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test-repo');
      expect(result[0].description).toBe('A test repository');
      expect(result[0].stargazerCount).toBe(5);
      expect(result[0].primaryLanguage?.name).toBe('TypeScript');
      expect(result[1].primaryLanguage).toBeNull();
    });

    it('should filter out private repositories', async () => {
      mockPages(
        page([repo({ name: 'public-repo' }), repo({ name: 'private-repo', private: true })])
      );

      const result = await service.getRepositories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('public-repo');
    });

    it('should filter out forked repositories', async () => {
      mockPages(page([repo({ name: 'original-repo' }), repo({ name: 'forked-repo', fork: true })]));

      const result = await service.getRepositories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('original-repo');
    });

    it('should sort repositories by pushed_at date descending', async () => {
      mockPages(
        page([
          repo({ name: 'old-repo', pushed_at: '2024-01-01T00:00:00Z' }),
          repo({ name: 'new-repo', pushed_at: '2025-01-01T00:00:00Z' }),
        ])
      );

      const result = await service.getRepositories();

      expect(result[0].name).toBe('new-repo');
      expect(result[1].name).toBe('old-repo');
    });

    it('should follow Link rel="next" until exhausted', async () => {
      const fetchMock = mockPages(
        page([repo({ name: 'page-1' })], 'https://api.github.com/next-page'),
        page([repo({ name: 'page-2' })])
      );

      const result = await service.getRepositories();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toBe('https://api.github.com/next-page');
      expect(result.map(r => r.name)).toEqual(['page-1', 'page-2']);
    });

    it('should stop at the page cap and warn instead of truncating silently', async () => {
      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockReset();
      // Every page claims another one after it, so only the cap ends the loop.
      fetchMock.mockResolvedValue(page([repo({ name: 'endless' })], 'https://api.github.com/more'));
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      await service.getRepositories();

      expect(fetchMock).toHaveBeenCalledTimes(10);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('truncated'));
      warn.mockRestore();
    });

    it('should serve the memoized result without re-fetching', async () => {
      const fetchMock = mockPages(page([repo({ name: 'cached-repo' })]));

      const first = await service.getRepositories();
      const second = await service.getRepositories();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
    });

    it('should coalesce concurrent calls into a single fetch', async () => {
      const fetchMock = mockPages(page([repo({ name: 'coalesced' })]));

      const [a, b] = await Promise.all([service.getRepositories(), service.getRepositories()]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(a).toEqual(b);
    });

    it('should serve a stale cache rather than failing when a refresh errors', async () => {
      mockPages(page([repo({ name: 'stale-repo' })]));
      await service.getRepositories();

      // Expire the cache so the next call re-fetches, then make that fail.
      (service as unknown as { cache: { expiresAt: number } }).cache.expiresAt = 0;
      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockRejectedValue(new Error('rate limited'));
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const result = await service.getRepositories();

      expect(result[0].name).toBe('stale-repo');
      error.mockRestore();
      warn.mockRestore();
    });

    it('should throw error when GitHub API fails', async () => {
      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockReset();
      fetchMock.mockResolvedValue({ ok: false, statusText: 'Not Found' });
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(service.getRepositories()).rejects.toThrow('GitHub API error: Not Found');
      error.mockRestore();
    });

    it('should throw error when fetch fails', async () => {
      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockReset();
      fetchMock.mockRejectedValue(new Error('Network error'));
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(service.getRepositories()).rejects.toThrow('Network error');
      error.mockRestore();
    });
  });
});

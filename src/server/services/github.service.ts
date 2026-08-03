import { singleton } from 'tsyringe';

export interface GitHubRepository {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  primaryLanguage: {
    name: string;
  } | null;
  pushedAt: string;
  isPrivate: boolean;
  isFork: boolean;
}

interface GitHubAPIRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  private: boolean;
  fork: boolean;
}

interface RepositoryCache {
  repositories: GitHubRepository[];
  expiresAt: number;
}

/** Unauthenticated GitHub allows 60 requests/hour; SSR plus client hydration
 * burns through that fast, so responses are cached for this long. */
export const REPOSITORY_CACHE_TTL_MS = 10 * 60 * 1000;

/** Hard stop on pagination so a pathological account cannot loop forever. */
const MAX_PAGES = 10;

/** Extract the `rel="next"` URL from a GitHub `Link` header, if present. */
function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }
  for (const part of linkHeader.split(',')) {
    const match = /<([^>]+)>\s*;\s*rel="next"/.exec(part);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

@singleton()
export class GitHubService {
  private readonly username = 'quinnjr';
  private readonly apiUrl = 'https://api.github.com';
  private readonly githubToken = process.env['GITHUB_TOKEN'] ?? '';

  private cache: RepositoryCache | null = null;
  /** Shared across concurrent callers so a burst of requests costs one fetch. */
  private inFlight: Promise<GitHubRepository[]> | null = null;

  async getRepositories(): Promise<GitHubRepository[]> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.repositories;
    }

    this.inFlight ??= this.fetchAllRepositories()
      .then(repositories => {
        this.cache = { repositories, expiresAt: Date.now() + REPOSITORY_CACHE_TTL_MS };
        return repositories;
      })
      .finally(() => {
        this.inFlight = null;
      });

    try {
      return await this.inFlight;
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      // Rate limit exhaustion is the common failure here; a stale list beats a
      // 500 for a page whose only job is listing repositories.
      if (this.cache) {
        console.warn('Serving stale GitHub repository cache after fetch failure');
        return this.cache.repositories;
      }
      throw error;
    }
  }

  /** Walk every `Link: rel="next"` page and return the filtered, sorted list. */
  private async fetchAllRepositories(): Promise<GitHubRepository[]> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'quinnjr.dev',
    };

    // Add authorization header if token is available
    if (this.githubToken) {
      headers['Authorization'] = `Bearer ${this.githubToken}`;
    }

    let nextUrl: string | null =
      `${this.apiUrl}/users/${this.username}/repos?per_page=100&sort=pushed`;
    const repos: GitHubAPIRepo[] = [];
    let pages = 0;

    while (nextUrl && pages < MAX_PAGES) {
      const response: Response = await fetch(nextUrl, { headers });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      repos.push(...((await response.json()) as GitHubAPIRepo[]));
      nextUrl = parseNextLink(response.headers.get('link'));
      pages += 1;
    }

    if (nextUrl) {
      // Loud on purpose: silent truncation looks identical to "no more repos".
      console.warn(
        `GitHub repository listing truncated after ${MAX_PAGES} pages; some repositories are missing`
      );
    }

    // Transform to our interface and filter out private repos and forks
    return repos
      .filter(repo => !repo.private && !repo.fork)
      .map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stargazerCount: repo.stargazers_count,
        primaryLanguage: repo.language ? { name: repo.language } : null,
        pushedAt: repo.pushed_at,
        isPrivate: repo.private,
        isFork: repo.fork,
      }))
      .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime());
  }
}

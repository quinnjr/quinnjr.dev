import { injectable } from 'tsyringe';

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

@injectable()
export class GitHubService {
  private readonly username = 'quinnjr';
  private readonly apiUrl = 'https://api.github.com';
  private readonly githubToken = process.env['GITHUB_TOKEN'] ?? '';

  async getRepositories(): Promise<GitHubRepository[]> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'quinnjr.dev',
      };

      // Add authorization header if token is available
      if (this.githubToken) {
        headers['Authorization'] = `Bearer ${this.githubToken}`;
      }

      const response = await fetch(
        `${this.apiUrl}/users/${this.username}/repos?per_page=100&sort=pushed`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const repos = (await response.json()) as GitHubAPIRepo[];

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
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      throw error;
    }
  }
}

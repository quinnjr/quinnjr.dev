import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

interface ApiResponse {
  success: boolean;
  /** Absent on a `success: false` body. */
  data?: GitHubRepository[];
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GitHubService {
  private readonly apiUrl = '/api/github';
  private readonly http = inject(HttpClient);

  getRepositories(): Observable<GitHubRepository[]> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/repositories`).pipe(
      map(response => {
        // The API signals failure in the body, not the status code, so an
        // unchecked `.data` would emit undefined typed as a repository list.
        if (response.success === false) {
          throw new Error(response.error ?? 'Failed to load GitHub repositories');
        }
        return response.data ?? [];
      })
    );
  }
}

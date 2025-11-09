import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
  data: GitHubRepository[];
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GitHubService {
  private readonly apiUrl = '/api/github';

  constructor(private http: HttpClient) {}

  getRepositories(): Observable<GitHubRepository[]> {
    return this.http
      .get<ApiResponse>(`${this.apiUrl}/repositories`)
      .pipe(map(response => response.data));
  }
}

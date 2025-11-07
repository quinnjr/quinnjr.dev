import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              <i class="fas fa-newspaper mr-2"></i>Blog Articles
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Manage your blog posts
            </p>
          </div>
          <a routerLink="/admin/articles/new"
             class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            <i class="fas fa-plus mr-2"></i>New Article
          </a>
        </div>

        <!-- Empty State -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <i class="fas fa-newspaper text-gray-400 text-6xl mb-4"></i>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            No articles yet
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Get started by creating your first blog post
          </p>
          <a routerLink="/admin/articles/new"
             class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            <i class="fas fa-plus mr-2"></i>Create Your First Article
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BlogListComponent {}


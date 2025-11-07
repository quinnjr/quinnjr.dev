import 'reflect-metadata';
import { container } from 'tsyringe';

import { BlogService } from './services/blog.service';
import { DatabaseService } from './services/database.service';
import { SitemapService } from './services/sitemap.service';

/**
 * Initialize the dependency injection container
 */
export function initializeContainer(): void {
  // Register services as singletons
  container.registerSingleton(DatabaseService);
  container.registerSingleton(BlogService);
  container.registerSingleton(SitemapService);

  // eslint-disable-next-line no-console
  console.log('✓ Dependency injection container initialized');
}

/**
 * Get a service from the container
 */
export function getService<T>(token: new (...args: unknown[]) => T): T {
  return container.resolve<T>(token);
}

export { container };

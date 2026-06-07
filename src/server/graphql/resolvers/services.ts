import { container } from 'tsyringe';

import { BlogService } from '../../services/blog.service';

/**
 * Lazily resolve the BlogService singleton. Kept lazy (resolved per call) so
 * tests can re-register a mock instance in the tsyringe container before each
 * resolver invocation.
 */
export const blog = () => container.resolve(BlogService);

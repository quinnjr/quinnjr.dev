import { container } from 'tsyringe';

import { BlogService } from '../../services/blog.service';
import { PasswordService } from '../../services/password.service';

/**
 * Lazily resolve the BlogService singleton. Kept lazy (resolved per call) so
 * tests can re-register a mock instance in the tsyringe container before each
 * resolver invocation.
 */
export const blog = () => container.resolve(BlogService);

/**
 * Lazily resolve the PasswordService singleton. Kept lazy so tests can
 * re-register a mock instance in the tsyringe container before each invocation.
 */
export const passwordService = () => container.resolve(PasswordService);

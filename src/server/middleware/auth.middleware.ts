import { type Request, type Response, type NextFunction } from 'express';
import { expressjwt, type GetVerificationKey } from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';

// Extend Express Request to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        [key: string]: unknown;
      };
    }
  }
}

/**
 * Auth0 JWT verification middleware
 * Validates JWT tokens from Auth0 and extracts user information
 */
export const authMiddleware = expressjwt({
  // Dynamically provide a signing key based on the kid in the header
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env['AUTH0_DOMAIN']}/.well-known/jwks.json`,
  }) as GetVerificationKey,

  // Validate the audience and the issuer
  audience: process.env['AUTH0_AUDIENCE'],
  issuer: `https://${process.env['AUTH0_DOMAIN']}/`,
  algorithms: ['RS256'],
});

/**
 * Optional auth middleware - doesn't fail if no token is provided
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuthMiddleware = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env['AUTH0_DOMAIN']}/.well-known/jwks.json`,
  }) as GetVerificationKey,
  audience: process.env['AUTH0_AUDIENCE'],
  issuer: `https://${process.env['AUTH0_DOMAIN']}/`,
  algorithms: ['RS256'],
  credentialsRequired: false,
});

/**
 * Error handler for JWT authentication errors
 */
export const authErrorHandler = (
  err: Error & { code?: string; status?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message || 'Invalid or missing authentication token',
    });
    return;
  }
  next(err);
};

/**
 * Middleware to extract userId from Auth0 JWT
 * Must be used after authMiddleware
 */
export const extractUserId = (req: Request, res: Response, next: NextFunction): void => {
  if (req.auth?.sub) {
    // Auth0 sub format: "auth0|userId" or "google-oauth2|userId"
    // Store the full sub as userId for consistency
    req.auth.userId = req.auth.sub;
    next();
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID not found in token',
    });
  }
};

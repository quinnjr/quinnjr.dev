import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const domain = process.env['AUTH0_DOMAIN'] ?? '';
const audience = process.env['AUTH0_AUDIENCE'] ?? '';
const issuer = domain ? `https://${domain}/` : '';

// Cache the JWKS across requests.
const jwks = domain
  ? createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`))
  : null;

/**
 * Verify an Auth0 access token from an Authorization header value.
 * Returns the verified payload, or null if absent/invalid.
 */
export async function verifyAccessToken(
  authorization: string | null,
): Promise<JWTPayload | null> {
  if (!authorization || !jwks) return null;
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.split('.').length !== 3) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience,
      algorithms: ['RS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

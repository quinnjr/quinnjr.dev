import { SignJWT, jwtVerify } from 'jose';

const secret = process.env['JWT_SECRET'] ?? '';
const key = secret ? new TextEncoder().encode(secret) : null;
const EXPIRY = '7d';

if (!key) {
  // eslint-disable-next-line no-console
  console.warn('JWT_SECRET is not set — authentication is disabled (all tokens rejected).');
}

export interface SessionClaims {
  sub: string;
  role: string;
}

/** Sign a 7-day HS256 session token for a user. */
export function signSession(user: { id: string; role: string }): Promise<string> {
  if (!key) {
    throw new Error('JWT_SECRET is not configured');
  }
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(key);
}

/** Verify a Bearer session token. Returns claims, or null if absent/invalid/expired. */
export async function verifySession(authorization: string | null): Promise<SessionClaims | null> {
  if (!authorization || !key) {
    return null;
  }
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (token.split('.').length !== 3) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload['role'] !== 'string') {
      return null;
    }
    return { sub: payload.sub, role: payload['role'] };
  } catch {
    return null;
  }
}

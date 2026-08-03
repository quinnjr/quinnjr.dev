import { SignJWT, jwtVerify } from 'jose';

const secret = process.env['JWT_SECRET'] ?? '';
const key = secret ? new TextEncoder().encode(secret) : null;
const EXPIRY = '7d';
/** Long enough to reach for a security key, short enough to bound the window
 *  in which a stolen password alone is worth anything. */
const MFA_EXPIRY = '5m';
const MFA_PURPOSE = 'mfa';

if (!key) {
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

/**
 * Sign a short-lived token proving the password step succeeded.
 *
 * This is deliberately NOT a session token: it carries `purpose: 'mfa'` and no
 * role, and `verifySession` rejects it, so presenting it as a Bearer credential
 * authenticates nothing. It exists only to carry the user's identity across the
 * two halves of the sign-in ceremony without trusting the client to assert it.
 */
export function signMfaToken(user: { id: string }): Promise<string> {
  if (!key) {
    throw new Error('JWT_SECRET is not configured');
  }
  return new SignJWT({ purpose: MFA_PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(MFA_EXPIRY)
    .sign(key);
}

/** Verify an MFA token and return the user id it was issued for, or null. */
export async function verifyMfaToken(token: string): Promise<string | null> {
  if (!key || !token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload['purpose'] !== MFA_PURPOSE || !payload.sub) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
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
    // An MFA token is signed with the same key and would otherwise be one
    // stray `role` claim away from being accepted as a session. Reject it on
    // purpose rather than relying on the absence of a claim.
    if (payload['purpose'] === MFA_PURPOSE) {
      return null;
    }
    if (!payload.sub || typeof payload['role'] !== 'string') {
      return null;
    }
    return { sub: payload.sub, role: payload['role'] };
  } catch {
    return null;
  }
}

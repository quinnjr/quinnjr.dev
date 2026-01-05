# Auth0 Authentication Setup

## Overview

The resume management system uses Auth0 for authentication. This document explains how Auth0 is configured and how to set it up.

## Architecture

```
Frontend (Angular)
  ↓ User Login
Auth0 (Authentication)
  ↓ JWT Token
Frontend with Token
  ↓ HTTP Request + Bearer Token
Express API (JWT Verification)
  ↓ Validated Request
Backend Services
```

## Components

### Frontend

**1. Auth0 Angular SDK** (`@auth0/auth0-angular`)
- Handles login/logout
- Manages authentication state
- Provides access tokens

**2. Auth Interceptor** (`src/app/interceptors/auth.interceptor.ts`)
- Automatically adds Bearer token to API requests
- Skips public endpoints
- Uses Auth0 SDK to get tokens

**3. Auth Guard** (`src/app/guards/auth.guard.ts`)
- Protects admin routes
- Redirects unauthenticated users to login

### Backend

**1. Auth Middleware** (`src/server/middleware/auth.middleware.ts`)
- Verifies JWT tokens from Auth0
- Extracts user information
- Protects API endpoints

**2. Protected Routes**
- All `/api/resume/*` endpoints except `/public`
- Require valid Auth0 JWT token
- Extract userId from token

## Auth0 Configuration

### 1. Auth0 Application Setup

Create an Auth0 Application (Single Page Application):

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new Application
3. Select "Single Page Application"
4. Configure settings:

```
Name: QuinnJR.dev
Application Type: Single Page Application

Allowed Callback URLs:
  http://localhost:4200/callback
  https://quinnjr.dev/callback

Allowed Logout URLs:
  http://localhost:4200
  https://quinnjr.dev

Allowed Web Origins:
  http://localhost:4200
  https://quinnjr.dev

Allowed Origins (CORS):
  http://localhost:4200
  https://quinnjr.dev
```

### 2. Auth0 API Setup

Create an Auth0 API:

1. Go to Applications → APIs
2. Create API
3. Configure:

```
Name: QuinnJR.dev API
Identifier: https://quinnjr.dev
Signing Algorithm: RS256
```

**Important**: The identifier is your domain (not a subdomain like `api.quinnjr.dev`). The API lives on the same server under `/api` routes, served by the Express backend on the SSR server.

4. Enable RBAC (Role-Based Access Control) if needed
5. Add Permissions (optional):
   - `read:resume`
   - `write:resume`
   - `delete:resume`

### 3. Environment Variables

**Frontend** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  auth0: {
    domain: 'dev-skrc3oude0nhleqs.us.auth0.com',
    clientId: '6XEiW5SoTUaBmWQjqXC6xmJhvjp6PqJW',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: 'https://quinnjr.dev', // API Identifier
    },
    httpInterceptor: {
      allowedList: ['/api/*'],
    },
  },
};
```

**Backend** (`.env`):
```bash
AUTH0_DOMAIN="dev-skrc3oude0nhleqs.us.auth0.com"
AUTH0_AUDIENCE="https://quinnjr.dev"
```

## Implementation Details

### Frontend Auth Flow

1. **User clicks "Login"**
   ```typescript
   authService.loginWithRedirect();
   ```

2. **Auth0 redirects to login page**
   - User enters credentials
   - Auth0 validates

3. **Auth0 redirects back with code**
   - Callback URL: `/callback`
   - Auth0 SDK exchanges code for tokens

4. **Tokens stored in memory**
   - Access Token (JWT)
   - ID Token
   - Refresh Token

5. **API requests include token**
   ```typescript
   // Automatic via authInterceptor
   Authorization: Bearer <access_token>
   ```

### Backend Auth Flow

1. **Request received with Bearer token**
   ```
   GET /api/resume
   Authorization: Bearer eyJhbGc...
   ```

2. **authMiddleware validates token**
   - Fetches Auth0 public keys (JWKS)
   - Verifies signature
   - Checks expiration
   - Validates audience and issuer

3. **extractUserId middleware**
   - Extracts `sub` from token
   - Stores as `req.auth.userId`

4. **Route handler uses userId**
   ```typescript
   const userId = req.auth!.userId;
   const resume = await resumeService.getResume(userId);
   ```

## Token Structure

### Access Token (JWT)

```json
{
  "iss": "https://dev-skrc3oude0nhleqs.us.auth0.com/",
  "sub": "auth0|507f1f77bcf86cd799439011",
  "aud": "https://quinnjr.dev",
  "iat": 1704398400,
  "exp": 1704484800,
  "scope": "openid profile email"
}
```

**Key Fields:**
- `iss`: Issuer (Auth0 domain)
- `sub`: Subject (user ID) - used as userId
- `aud`: Audience (API identifier)
- `exp`: Expiration timestamp
- `scope`: Permissions granted

## Security Features

### Token Validation

✅ **Signature Verification**: Uses Auth0 public keys (JWKS)
✅ **Expiration Check**: Tokens expire after 24 hours
✅ **Audience Validation**: Must match API identifier
✅ **Issuer Validation**: Must be from Auth0 domain
✅ **Algorithm Check**: Only RS256 allowed

### Protection Layers

1. **Frontend**: Auth guard prevents unauthorized access
2. **Backend**: JWT middleware validates every request
3. **Database**: userId ensures data isolation

## Testing

### Manual Testing

**1. Test Login Flow:**
```bash
# 1. Start server
pnpm dev

# 2. Navigate to http://localhost:4200/admin
# 3. Click "Login"
# 4. Enter Auth0 credentials
# 5. Should redirect to admin dashboard
```

**2. Test API with Token:**
```bash
# Get token from browser console
# (After logging in, run in browser console:)
# auth0Client.getTokenSilently().then(console.log)

# Use token in API request
curl http://localhost:4000/api/resume \
  -H "Authorization: Bearer <your-token>"
```

**3. Test Unauthorized Access:**
```bash
# Without token - should return 401
curl http://localhost:4000/api/resume

# With invalid token - should return 401
curl http://localhost:4000/api/resume \
  -H "Authorization: Bearer invalid-token"
```

### Automated Testing

Create test helper to get tokens:

```typescript
// test/helpers/auth.helper.ts
import axios from 'axios';

export async function getTestToken(): Promise<string> {
  const response = await axios.post(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_TEST_CLIENT_ID,
      client_secret: process.env.AUTH0_TEST_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
    }
  );
  return response.data.access_token;
}
```

## Troubleshooting

### "Unauthorized" Error

**Symptoms**: 401 error when accessing API

**Causes:**
1. Token expired
2. Invalid audience
3. Wrong Auth0 domain
4. Token not included in request

**Solutions:**
```bash
# Check environment variables
echo $AUTH0_DOMAIN
echo $AUTH0_AUDIENCE

# Verify token in jwt.io
# Copy token from browser and paste in jwt.io

# Check token expiration
# Token expires after 24 hours - logout and login again
```

### "Token not found" Error

**Symptoms**: Frontend can't get token

**Causes:**
1. Not logged in
2. Auth0 SDK not configured
3. Audience not set

**Solutions:**
```typescript
// Check Auth0 config includes audience
authorizationParams: {
  audience: 'https://quinnjr.dev',
}

// Verify user is logged in
authService.isAuthenticated$.subscribe(console.log);
```

### CORS Errors

**Symptoms**: CORS error in browser console

**Causes:**
1. Origin not allowed in Auth0
2. Missing CORS configuration

**Solutions:**
1. Add origin to Auth0 Allowed Origins
2. Verify Auth0 Application settings
3. Check browser console for exact error

### "Invalid signature" Error

**Symptoms**: JWT verification fails

**Causes:**
1. Wrong Auth0 domain
2. Token from different Auth0 tenant
3. Token tampered with

**Solutions:**
```bash
# Verify Auth0 domain matches
# Frontend: environment.auth0.domain
# Backend: process.env.AUTH0_DOMAIN

# Check JWKS endpoint
curl https://${AUTH0_DOMAIN}/.well-known/jwks.json
```

## Production Deployment

### Environment Variables

```bash
# Production .env
AUTH0_DOMAIN="your-production-domain.auth0.com"
AUTH0_AUDIENCE="https://quinnjr.dev"
NODE_ENV=production
```

### Auth0 Production Settings

1. **Update Callback URLs**:
   ```
   https://quinnjr.dev/callback
   ```

2. **Update Allowed Origins**:
   ```
   https://quinnjr.dev
   ```

3. **Enable MFA** (Multi-Factor Authentication):
   - Go to Security → Multi-factor Auth
   - Enable for all users

4. **Configure Rules** (optional):
   - Add custom claims
   - Enforce email verification
   - Add user metadata

### Security Checklist

- ✅ HTTPS enabled
- ✅ Secure cookies
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ MFA enabled
- ✅ Email verification required
- ✅ Strong password policy
- ✅ Session timeout configured

## Advanced Configuration

### Custom Claims

Add custom data to tokens:

```javascript
// Auth0 Rule
function addCustomClaims(user, context, callback) {
  const namespace = 'https://quinnjr.dev/';
  context.accessToken[namespace + 'role'] = user.app_metadata.role;
  callback(null, user, context);
}
```

### Role-Based Access Control

```typescript
// Backend middleware
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.auth?.['https://quinnjr.dev/role'];
    if (userRole !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Usage
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  // Only admins can delete
});
```

## Monitoring

### Auth0 Dashboard

Monitor authentication:
- Login attempts
- Failed logins
- Active users
- Token usage

### Backend Logging

Log authentication events:

```typescript
router.use((req, res, next) => {
  if (req.auth) {
    console.log('Authenticated request:', {
      userId: req.auth.userId,
      endpoint: req.path,
      timestamp: new Date(),
    });
  }
  next();
});
```

## Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Angular SDK](https://github.com/auth0/auth0-angular)
- [express-jwt Documentation](https://github.com/auth0/express-jwt)
- [JWT.io](https://jwt.io) - Token debugger

## Support

For Auth0-related issues:
1. Check Auth0 logs in dashboard
2. Verify configuration matches this guide
3. Test with jwt.io
4. Check browser console for errors
5. Review Auth0 documentation

---

**Last Updated**: January 4, 2026
**Version**: 1.0.0

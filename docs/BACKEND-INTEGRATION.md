# Backend Integration for Resume Management

## Overview

The resume management system now includes full backend support using Express.js, Prisma ORM, and PostgreSQL. Resume data is persisted to the database and served via REST API endpoints.

## Architecture

### Stack

- **Backend**: Express.js (Node.js)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Frontend**: Angular with HttpClient
- **Authentication**: Auth0 (TODO: Add JWT middleware)

### Data Flow

```
Frontend (Angular)
  ↓ HTTP Request
Express API (/api/resume)
  ↓ Service Layer
Prisma ORM
  ↓ SQL
PostgreSQL Database
```

## Database Schema

### Resume Model

```prisma
model Resume {
  id              String   @id @default(uuid())

  // Contact Information
  name            String
  email           String
  linkedin        String?
  github          String?
  website         String?
  company         String?
  profilePicture  String?

  // Profile Summary
  summary         Json     // Array of summary paragraphs
  barAdmission    Json?    // Array of bar admissions
  interests       Json?    // Array of special interests

  // Complex data stored as JSON
  experience      Json     // Array of Experience objects
  education       Json     // Array of Education objects
  projects        Json?    // Array of Project objects
  skills          Json     // Array of Skill objects
  certifications  Json     // Array of Certification objects
  memberships     Json?    // Array of Professional Membership objects

  // Metadata
  userId          String   // Owner's user ID (Auth0)
  version         Int      @default(1) // For version tracking

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@map("resumes")
}
```

### Design Decisions

1. **JSON Fields**: Complex nested data (experience, education, etc.) stored as JSON for flexibility
2. **Version Tracking**: Each update increments version number for history
3. **Single User**: Currently designed for single-user (site owner) but supports multi-user via userId
4. **Soft Updates**: Each save creates a new version rather than overwriting

## API Endpoints

### Public Endpoints

#### GET `/api/resume/public`
Get the most recent public resume (no authentication required).

**Response:**
```json
{
  "id": "uuid",
  "name": "Joseph R. Quinn, Esq.",
  "email": "joseph@quinnjr.tech",
  "linkedin": "https://www.linkedin.com/in/quinnjosephr/",
  "summary": ["paragraph 1", "paragraph 2"],
  "experience": [...],
  "education": [...],
  "skills": [...],
  "certifications": [...],
  "version": 5,
  "createdAt": "2026-01-04T...",
  "updatedAt": "2026-01-04T..."
}
```

### Protected Endpoints (Require Auth0)

#### GET `/api/resume`
Get the authenticated user's resume.

**Headers:**
```
Authorization: Bearer <auth0-jwt-token>
X-User-Id: <user-id> (temporary - will be extracted from JWT)
```

**Response:** Same as public endpoint

#### PUT `/api/resume`
Create or update the entire resume.

**Headers:** Same as GET

**Request Body:**
```json
{
  "name": "Joseph R. Quinn, Esq.",
  "email": "joseph@quinnjr.tech",
  "linkedin": "...",
  "summary": ["..."],
  "experience": [...],
  "education": [...],
  "skills": [...],
  "certifications": [...],
  "memberships": [...]
}
```

**Response:** Updated resume object

#### PATCH `/api/resume`
Update partial resume data.

**Headers:** Same as GET

**Request Body:** Partial resume object (only fields to update)

**Response:** Updated resume object

#### GET `/api/resume/history?limit=10`
Get version history of the resume.

**Headers:** Same as GET

**Query Parameters:**
- `limit` (optional): Number of versions to return (default: 10)

**Response:**
```json
[
  { "id": "...", "version": 5, "updatedAt": "...", ... },
  { "id": "...", "version": 4, "updatedAt": "...", ... },
  ...
]
```

#### DELETE `/api/resume/:id`
Delete a specific resume version.

**Headers:** Same as GET

**Response:** 204 No Content

## Backend Services

### ResumeService (`src/server/services/resume.service.ts`)

Main service for resume operations:

```typescript
class ResumeService {
  // Get user's resume
  async getResume(userId: string): Promise<ResumeData | null>

  // Get public resume (latest)
  async getPublicResume(): Promise<ResumeData | null>

  // Create or update resume
  async upsertResume(data: ResumeData): Promise<ResumeData>

  // Update partial data
  async updateResume(userId: string, updates: Partial<ResumeData>): Promise<ResumeData>

  // Get version history
  async getResumeHistory(userId: string, limit?: number): Promise<ResumeData[]>

  // Delete resume
  async deleteResume(userId: string, resumeId: string): Promise<void>
}
```

## Frontend Integration

### ResumeService (`src/app/services/resume.service.ts`)

Updated to use HTTP:

```typescript
class ResumeService {
  // Load from API on init
  constructor() {
    this.loadResumeFromAPI();
  }

  // Get resume data (Observable)
  getResumeData(): Observable<ResumeData>

  // Reload from API
  reloadResume(): Observable<ResumeData>

  // Update contact info (saves to API)
  updateContactInfo(updates: Partial<ContactInfo>): Observable<ResumeData>

  // Update resume data (saves to API)
  updateResumeData(updates: Partial<ResumeData>): Observable<ResumeData>
}
```

### Key Changes

1. **Automatic Loading**: Resume loads from API on service initialization
2. **Observable Returns**: All update methods now return Observables
3. **Error Handling**: Falls back to default data if API fails
4. **Optimistic Updates**: Updates local state even if API fails

## Setup Instructions

### 1. Database Setup

Ensure PostgreSQL is running and DATABASE_URL is set:

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/quinnjr_dev"
```

### 2. Generate Prisma Client

```bash
pnpm prisma:generate
```

### 3. Create Migration

```bash
pnpm prisma migrate dev --name add_resume_model
```

### 4. Seed Initial Data (Optional)

Create a seed script to populate initial resume data:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.resume.create({
    data: {
      userId: 'your-auth0-user-id',
      name: 'Joseph R. Quinn, Esq.',
      email: 'joseph@quinnjr.tech',
      // ... rest of resume data
    },
  });
}

main();
```

Run seed:
```bash
pnpm prisma db seed
```

### 5. Start Server

```bash
pnpm dev
```

## Authentication

✅ **Implemented**: Full Auth0 JWT authentication

### Auth0 JWT Middleware

Located at `src/server/middleware/auth.middleware.ts`:

```typescript
import { expressjwt } from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';

export const authMiddleware = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});
```

### Applied to Routes

All protected endpoints use Auth0 authentication:

```typescript
// src/server/routes/resume.ts
import { authMiddleware, extractUserId } from '../middleware/auth.middleware';

router.get('/', authMiddleware, extractUserId, async (req, res) => {
  const userId = req.auth.userId; // Extracted from JWT
  // ...
});
```

### Frontend Integration

HTTP Interceptor automatically adds Bearer token:

```typescript
// src/app/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return authService.getAccessTokenSilently().pipe(
    switchMap(token => {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(authReq);
    })
  );
};
```

**See [AUTH0-SETUP.md](./AUTH0-SETUP.md) for complete authentication guide.**

## Testing

### Manual API Testing

```bash
# Get public resume
curl http://localhost:4000/api/resume/public

# Update resume (with auth)
curl -X PUT http://localhost:4000/api/resume \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{"name": "Test", "email": "test@example.com", ...}'

# Get history
curl http://localhost:4000/api/resume/history?limit=5 \
  -H "X-User-Id: your-user-id"
```

### Integration Tests

Create tests in `src/server/__tests__/resume.service.spec.ts`:

```typescript
describe('ResumeService', () => {
  it('should create resume', async () => {
    const resume = await resumeService.upsertResume(testData);
    expect(resume.id).toBeDefined();
  });

  it('should get public resume', async () => {
    const resume = await resumeService.getPublicResume();
    expect(resume).toBeDefined();
  });

  it('should track versions', async () => {
    await resumeService.upsertResume(testData);
    await resumeService.upsertResume(updatedData);
    const history = await resumeService.getResumeHistory(userId);
    expect(history).toHaveLength(2);
  });
});
```

## Deployment

### Environment Variables

```bash
DATABASE_URL="postgresql://..."
AUTH0_DOMAIN="your-domain.auth0.com"
AUTH0_AUDIENCE="your-api-identifier"
PORT=4000
NODE_ENV=production
```

### Docker

Dockerfile already includes Prisma setup:

```dockerfile
# Generate Prisma Client
RUN pnpm prisma:generate

# Run migrations on startup
CMD pnpm prisma migrate deploy && node dist/quinnjr.dev/server/server.mjs
```

### Database Migrations

In production:

```bash
# Run pending migrations
pnpm prisma migrate deploy

# Check migration status
pnpm prisma migrate status
```

## Monitoring

### Logging

Add logging to resume operations:

```typescript
console.log('Resume updated:', {
  userId,
  version: resume.version,
  timestamp: new Date()
});
```

### Error Tracking

Consider adding Sentry or similar:

```typescript
try {
  await resumeService.upsertResume(data);
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

## Performance Considerations

### Caching

Consider caching public resume:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

router.get('/public', async (req, res) => {
  const cached = cache.get('public-resume');
  if (cached) return res.json(cached);

  const resume = await resumeService.getPublicResume();
  cache.set('public-resume', resume);
  res.json(resume);
});
```

### Database Indexing

Already indexed on `userId`. Consider adding:

```prisma
@@index([updatedAt])  // For history queries
@@index([version])    // For version lookups
```

## Troubleshooting

### "Resume not found" Error

- Check DATABASE_URL is correct
- Verify migrations ran successfully
- Check userId matches Auth0 user ID
- Seed initial data if database is empty

### API Returns Default Data

- Check Express server is running
- Verify `/api/resume/public` endpoint is accessible
- Check browser console for CORS errors
- Verify Prisma Client is generated

### Version Conflicts

Each update creates a new version. To reset:

```sql
DELETE FROM resumes WHERE user_id = 'your-user-id';
```

## Future Enhancements

1. **GraphQL API**: Consider GraphQL for more flexible queries
2. **Real-time Updates**: WebSocket for live collaboration
3. **File Uploads**: S3 integration for profile pictures
4. **Search**: Full-text search on resume content
5. **Analytics**: Track resume views and downloads
6. **Export**: PDF generation endpoint

## Related Documentation

- [Admin UI](./ADMIN-UI.md) - Frontend admin interface
- [LinkedIn Sync](./LINKEDIN-SYNC.md) - LinkedIn integration
- [Prisma Schema](../prisma/schema.prisma) - Database schema

---

**Last Updated**: January 4, 2026
**Version**: 1.0.0

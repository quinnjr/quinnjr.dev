# Quick Start Guide - Resume Management System

## 🚀 Getting Started

### Prerequisites
- PostgreSQL running
- Node.js 22+
- pnpm installed
- Auth0 account (free tier works)

### Setup (5 minutes)

```bash
# 1. Set environment variables
cat >> .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/quinnjr_dev"
AUTH0_DOMAIN="dev-skrc3oude0nhleqs.us.auth0.com"
AUTH0_AUDIENCE="https://quinnjr.dev"
EOF

# 2. Generate Prisma client
pnpm prisma:generate

# 3. Create database migration
pnpm prisma migrate dev --name add_resume_model

# 4. Start the server
pnpm dev
```

**Note**: See [AUTH0-SETUP.md](./AUTH0-SETUP.md) for Auth0 configuration details.

## 📝 Using the Admin UI

### Access
1. Navigate to `http://localhost:4000/admin`
2. Login with Auth0
3. Click **"Edit Resume"**

### Edit Resume
1. **Select Section**: Click sidebar (Contact, Profile, Experience, etc.)
2. **Edit Fields**: Modify form fields
3. **Save**: Click "Save Changes" button
4. **Done**: Changes saved to database!

### Sections
- **📇 Contact**: Name, email, social links
- **👤 Profile**: Summary, bar admissions, interests
- **💼 Experience**: Work history
- **🎓 Education**: Schools and degrees
- **📊 Projects**: Personal projects
- **💻 Skills**: Technical skills

## 🔌 API Endpoints

### Public
```bash
# Get resume (no auth)
curl http://localhost:4000/api/resume/public
```

### Protected (requires Auth0)
```bash
# Get user's resume
curl http://localhost:4000/api/resume \
  -H "X-User-Id: your-user-id"

# Update resume
curl -X PUT http://localhost:4000/api/resume \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d @resume.json

# Get history
curl http://localhost:4000/api/resume/history \
  -H "X-User-Id: your-user-id"
```

## 🗄️ Database

### View Data
```bash
# Open Prisma Studio
pnpm prisma studio
```

### Migrations
```bash
# Create migration
pnpm prisma migrate dev --name your_migration_name

# Apply migrations (production)
pnpm prisma migrate deploy

# Reset database (dev only)
pnpm prisma migrate reset
```

## 🧪 Testing

### Manual Testing
1. Edit resume in admin UI
2. Save changes
3. Refresh page - data persists
4. Check `/resume` page - changes visible

### API Testing
```bash
# Test public endpoint
curl http://localhost:4000/api/resume/public | jq

# Test update (requires data)
curl -X PUT http://localhost:4000/api/resume \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test" \
  -d '{"name":"Test","email":"test@example.com","summary":[],"experience":[],"education":[],"skills":[],"certifications":[]}'
```

## 🐛 Troubleshooting

### "Resume not found"
```bash
# Check database connection
pnpm prisma studio

# Seed initial data (create seed script first)
pnpm prisma db seed
```

### API not responding
```bash
# Check server is running
curl http://localhost:4000/api/resume/public

# Check logs
# Look for errors in terminal where server is running
```

### Changes not saving
1. Check browser console for errors
2. Verify DATABASE_URL is correct
3. Ensure Prisma client is generated
4. Check server logs

## 📚 Documentation

- **[Admin UI](./ADMIN-UI.md)** - Full admin interface guide
- **[Admin UI Guide](./ADMIN-UI-GUIDE.md)** - User guide
- **[Backend Integration](./BACKEND-INTEGRATION.md)** - Technical details
- **[LinkedIn Sync](./LINKEDIN-SYNC.md)** - LinkedIn integration

## ⚡ Common Tasks

### Add New Resume Field
1. Update `prisma/schema.prisma`
2. Update `src/server/services/resume.service.ts`
3. Update `src/app/models/resume.model.ts`
4. Update admin UI component
5. Run migration: `pnpm prisma migrate dev`

### Reset to Default Data
```bash
# Delete all resumes
pnpm prisma studio
# Navigate to Resume table
# Delete all records
```

### Export Resume
```bash
# Get resume as JSON
curl http://localhost:4000/api/resume/public > resume.json
```

## 🚢 Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
PORT=4000
NODE_ENV=production
```

### Deploy Steps
```bash
# 1. Build
pnpm build

# 2. Run migrations
pnpm prisma migrate deploy

# 3. Start
node dist/quinnjr.dev/server/server.mjs
```

## 💡 Tips

- **Save Often**: Changes save to database immediately
- **Version History**: Every save creates a new version
- **Fallback**: If API fails, uses default data
- **Dark Mode**: Automatically adapts to system preference
- **Mobile**: Fully responsive design

## 🆘 Need Help?

1. Check documentation in `docs/` folder
2. Review browser console for errors
3. Check server logs
4. Verify database connection
5. Test API endpoints with curl

---

**Quick Links:**
- Admin UI: `http://localhost:4000/admin`
- Public Resume: `http://localhost:4000/resume`
- API Docs: [BACKEND-INTEGRATION.md](./BACKEND-INTEGRATION.md)
- Prisma Studio: `pnpm prisma studio`

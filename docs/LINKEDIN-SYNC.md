# LinkedIn Profile Sync

This document explains how to sync your LinkedIn profile data with your resume on quinnjr.dev.

## Overview

The resume component has been refactored to use a centralized `ResumeService` that manages all resume data. This makes it easy to update your resume information from LinkedIn or other sources.

## Architecture

### Files Created/Modified

1. **Models**
   - `src/app/models/resume.model.ts` - TypeScript interfaces for resume data

2. **Services**
   - `src/app/services/resume.service.ts` - Centralized resume data management
   - `src/app/services/resume.service.spec.ts` - Unit tests for the service

3. **Components**
   - `src/app/pages/resume/resume.component.ts` - Updated to use ResumeService
   - `src/app/pages/resume/resume.component.html` - Updated to use dynamic data

4. **Scripts**
   - `scripts/sync-linkedin.ts` - Helper script for LinkedIn sync

5. **Structured Data**
   - `src/index.html` - Updated profile picture path in JSON-LD

## How to Sync with LinkedIn

### Method 1: Using LinkedIn MCP Tools (Recommended)

The LinkedIn MCP server provides tools to fetch your profile data. Use these in your AI workflow:

```typescript
// Example: Fetch LinkedIn profile
const profile = await mcp_linkedin_get_linkedin_profile();

// The profile will contain:
// - firstName, lastName
// - headline
// - profilePictureUrl
// - vanityName
```

### Method 2: Manual Update

1. **Update Contact Information**

Edit `src/app/services/resume.service.ts` and modify the `resumeData` object:

```typescript
contact: {
  name: 'Joseph R. Quinn, Esq.',
  email: 'joseph@quinnjr.tech',
  linkedin: 'https://www.linkedin.com/in/quinnjosephr/',
  profilePicture: '/profile_picture.jpg',
  // ... other fields
}
```

2. **Update Profile Picture**

Download your LinkedIn profile picture and save it to:
```
public/profile_picture.jpg
```

3. **Update Structured Data**

The structured data in `src/index.html` includes your profile information for SEO. Update if needed:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Joseph R. Quinn",
  "image": "https://quinnjr.dev/profile_picture.jpg",
  ...
}
</script>
```

## Current Sync Status

### ✅ Completed
- Profile picture synced from LinkedIn (January 4, 2026)
- Resume component refactored to use dynamic data
- Structured data updated with correct profile picture path
- Service-based architecture implemented

### LinkedIn API Limitations

The LinkedIn API with your current access token provides limited data:
- ✅ Basic name (firstName, lastName)
- ✅ Profile picture URL
- ❌ Headline (empty)
- ❌ Detailed work experience
- ❌ Education history
- ❌ Skills

**Note**: LinkedIn has become increasingly restrictive with their API. Most detailed profile data requires special API access or LinkedIn Partner status.

## Resume Data Structure

The resume service manages the following data:

```typescript
interface ResumeData {
  contact: ContactInfo;           // Name, email, social links
  profile: {                       // Profile summary
    summary: string[];
    highlights?: string[];
    barAdmission?: string[];
    interests?: string[];
  };
  skills: Skill[];                 // Technical and soft skills
  education: Education[];          // Academic background
  experience: Experience[];        // Work history
  certifications: Certification[]; // Professional certifications
  professionalMemberships: ProfessionalMembership[];
}
```

## Updating Resume Data

### Using the Service

```typescript
import { ResumeService } from './services/resume.service';

// Inject the service
private resumeService = inject(ResumeService);

// Update contact info
this.resumeService.updateContactInfo({
  email: 'newemail@example.com',
  linkedin: 'https://www.linkedin.com/in/newprofile/'
});

// Sync with LinkedIn
this.resumeService.syncWithLinkedIn({
  firstName: 'Joseph',
  lastName: 'Quinn',
  profilePictureUrl: 'https://...',
  vanityName: 'quinnjosephr'
});
```

## Testing

Run the resume service tests:

```bash
pnpm test src/app/services/resume.service.spec.ts
```

## Future Enhancements

1. **API Integration**: Create a backend endpoint to fetch LinkedIn data
2. **Admin Panel**: Build a UI to update resume data without editing code
3. **Version Control**: Track changes to resume data over time
4. **Export**: Generate PDF/Word versions of the resume
5. **Multi-language**: Support multiple language versions

## Troubleshooting

### Profile Picture Not Updating

1. Clear browser cache
2. Check that `public/profile_picture.jpg` exists
3. Verify the image is a valid JPEG/PNG
4. Check browser console for 404 errors

### Resume Data Not Showing

1. Check browser console for errors
2. Verify the ResumeService is properly injected
3. Ensure the async pipe is used in the template
4. Check that the observable is initialized in `ngOnInit`

## Related Files

- Resume Component: `src/app/pages/resume/`
- Resume Service: `src/app/services/resume.service.ts`
- Resume Models: `src/app/models/resume.model.ts`
- Structured Data: `src/index.html` (lines 68-129)

## Support

For issues or questions, contact joseph@quinnjr.tech or create an issue in the repository.

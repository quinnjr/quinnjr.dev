# Admin UI Documentation

## Overview

The Admin UI provides a secure, authenticated interface for managing your resume data through a web-based dashboard. All admin routes are protected by Auth0 authentication.

## Features

### Resume Editor

A comprehensive editor for managing all aspects of your resume:

- **Contact Information**: Edit name, email, LinkedIn, GitHub, website, company, and profile picture
- **Profile Summary**: Manage summary paragraphs, bar admissions, and special interests
- **Work Experience**: Add, edit, and remove work experiences with full details
- **Education**: Manage educational background with institution details and activities
- **Projects**: Track personal and professional projects with dates and descriptions
- **Skills**: Organize skills with optional categories

### Access

**URL**: `/admin/resume`

**Authentication**: Required (Auth0)

## Architecture

### Components

#### Main Component
- **Path**: `src/app/modules/admin/resume-editor/resume-editor.component.ts`
- **Purpose**: Main container with section navigation and data management
- **Features**:
  - Sidebar navigation for switching between sections
  - Real-time data loading from ResumeService
  - Section-based editing workflow

#### Sub-Components

1. **Contact Editor** (`components/contact-editor.component.ts`)
   - Edits contact information
   - Validates email format
   - All fields except name and email are optional

2. **Profile Editor** (`components/profile-editor.component.ts`)
   - Manages summary paragraphs (dynamic array)
   - Bar admissions list
   - Special interests list
   - Add/remove functionality for all arrays

3. **Experience Editor** (`components/experience-editor.component.ts`)
   - Full CRUD for work experiences
   - Fields: company, position, location, dates, description
   - "Current Position" checkbox
   - Required: company and position

4. **Education Editor** (`components/education-editor.component.ts`)
   - Manages educational background
   - Fields: institution, degree, field, dates, location, logo
   - Activities array (dynamic)
   - Required: institution and degree

5. **Projects Editor** (`components/projects-editor.component.ts`)
   - Project management with flexible date fields
   - Supports both single date and date range
   - Optional URL and description
   - Required: project name

6. **Skills Editor** (`components/skills-editor.component.ts`)
   - Simple skill management
   - Optional category field for grouping
   - Required: skill name

## Data Flow

```
User Input → Component Form → ResumeService → BehaviorSubject → Resume Component
```

### How It Works

1. **Loading Data**:
   - Resume editor subscribes to `ResumeService.getResumeData()`
   - Data is loaded into each sub-component via input signals
   - Forms are initialized with current values

2. **Saving Data**:
   - Each sub-component has its own form validation
   - On submit, calls appropriate ResumeService method
   - Service updates the BehaviorSubject
   - Changes are immediately reflected in the public resume

3. **Persistence**:
   - Currently in-memory (BehaviorSubject)
   - Changes persist during session
   - **TODO**: Add backend API for permanent storage

## Usage

### Accessing the Admin UI

1. Navigate to `/admin` or click "Login" in the header
2. Authenticate via Auth0
3. Click "Edit Resume" from the dashboard or navigate to `/admin/resume`

### Editing Resume Sections

1. **Select a Section**: Click on a section in the left sidebar
2. **Edit Fields**: Modify the form fields as needed
3. **Add/Remove Items**: Use + and trash icons for array fields
4. **Save**: Click "Save Changes" button
5. **Success**: Alert confirms the save

### Form Validation

- Required fields are marked with `*`
- Email fields validate format
- Save button is disabled until form is valid
- Empty array items are filtered out on save

## Navigation

### Admin Layout

The admin section has a consistent layout with:
- **Header**: Admin branding, navigation, auth button
- **Navigation Links**:
  - Dashboard
  - Articles
  - Projects
  - Resume (new)
  - Settings
- **View Site**: Link back to public site

### Quick Actions

From the admin dashboard:
- **New Article**: Create a blog post
- **Edit Resume**: Jump to resume editor
- **Settings**: Site configuration
- **Analytics**: View site statistics

## Styling

All components use Tailwind CSS with:
- Dark mode support
- Responsive design (mobile-friendly)
- Consistent color scheme:
  - Primary: Blue (actions, links)
  - Success: Green (confirmations)
  - Danger: Red (delete actions)
  - Gray: Neutral elements

### Design Patterns

- **Cards**: White/gray-800 with rounded corners and shadow
- **Forms**: Bordered inputs with focus states
- **Buttons**: Icon + text with hover states
- **Sidebar**: Sticky navigation with active state highlighting

## Security

### Authentication

- **Provider**: Auth0
- **Guard**: `authGuard` protects all `/admin/*` routes
- **Redirect**: Unauthenticated users redirected to login
- **Session**: Managed by Auth0 SDK

### Authorization

Currently single-user (you). For multi-user:
- Add role-based access control (RBAC)
- Check user permissions in Auth0
- Implement in `authGuard` or component-level guards

## Future Enhancements

### Backend Integration

```typescript
// Add to ResumeService
saveToBackend(): Observable<ResumeData> {
  return this.http.post<ResumeData>('/api/resume', this.resumeData);
}

loadFromBackend(): Observable<ResumeData> {
  return this.http.get<ResumeData>('/api/resume');
}
```

### LinkedIn Sync Button

Add to resume editor:
```typescript
syncFromLinkedIn(): void {
  // Call LinkedIn MCP API
  // Update form with fetched data
  // Show diff/merge UI
}
```

### Version History

- Track changes over time
- Revert to previous versions
- Compare versions side-by-side

### Import/Export

- Export resume as JSON
- Import from JSON file
- Export as PDF (using resume component)

### Real-time Preview

- Split-screen editor
- Live preview of public resume
- Toggle between edit and preview modes

## Testing

### Manual Testing

1. **Authentication**:
   - Try accessing `/admin/resume` without login → should redirect
   - Login and verify access granted

2. **Data Persistence**:
   - Edit each section
   - Navigate away and back
   - Verify changes persist

3. **Form Validation**:
   - Try submitting with empty required fields
   - Verify validation messages
   - Verify save button disabled state

4. **Responsive Design**:
   - Test on mobile viewport
   - Verify sidebar collapses/adapts
   - Check form layout on small screens

### Unit Tests

Create tests for each component:

```typescript
describe('ContactEditorComponent', () => {
  it('should validate email format', () => {
    // Test email validation
  });

  it('should save contact info', () => {
    // Test save functionality
  });
});
```

## Troubleshooting

### Changes Not Saving

- Check browser console for errors
- Verify ResumeService is injected
- Check form validation state

### Auth Issues

- Clear browser cookies/cache
- Check Auth0 configuration
- Verify environment variables

### Styling Issues

- Ensure Tailwind CSS is loaded
- Check for conflicting styles
- Verify dark mode classes

## Related Documentation

- [LinkedIn Sync](./LINKEDIN-SYNC.md) - Syncing with LinkedIn profile
- [LinkedIn Scraping](./LINKEDIN-SCRAPING.md) - Web scraping approach
- [Resume Service](../src/app/services/resume.service.ts) - Data management
- [Resume Model](../src/app/models/resume.model.ts) - Data structures

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check browser console for errors
4. Review Auth0 logs for authentication issues

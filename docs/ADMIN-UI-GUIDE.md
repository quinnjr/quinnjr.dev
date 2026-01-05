# Admin UI Quick Start Guide

## Getting Started

### 1. Access the Admin Panel

Navigate to: `https://quinnjr.dev/admin`

Or click the **Login** button in the site header.

### 2. Authenticate

You'll be redirected to Auth0 for authentication. After successful login, you'll land on the Admin Dashboard.

## Admin Dashboard

The dashboard shows:
- **User Information**: Your profile picture, name, and email
- **Statistics**: Quick stats about your site
- **Quick Actions**: Fast access to common tasks

### Quick Actions

- **New Article**: Create a blog post
- **Edit Resume**: ← Click here to edit your resume
- **Settings**: Configure site settings
- **Analytics**: View site statistics

## Resume Editor

### Navigation

The resume editor has two main sections:

#### Left Sidebar (Section Navigation)
```
📇 Contact Info
👤 Profile
💼 Experience
🎓 Education
📊 Projects
💻 Skills
```

Click any section to edit that part of your resume.

#### Main Content Area

Shows the editor for the selected section with:
- Form fields for data entry
- Add/remove buttons for lists
- Save button at the bottom

### Editing Each Section

#### 📇 Contact Info

Edit your basic contact information:

**Fields:**
- Full Name* (required)
- Email* (required)
- LinkedIn URL
- GitHub URL
- Website URL
- Company URL
- Profile Picture Path

**Example:**
```
Name: Joseph R. Quinn, Esq.
Email: joseph@quinnjr.tech
LinkedIn: https://www.linkedin.com/in/quinnjosephr/
GitHub: https://github.com/quinnjr
Profile Picture: /profile_picture.jpg
```

#### 👤 Profile

Manage your professional summary and credentials:

**Sections:**
1. **Summary Paragraphs**: Multiple text areas for your bio
   - Click **+ Add Paragraph** to add more
   - Click trash icon to remove

2. **Bar Admissions**: List of bar admissions
   - Add/remove with + and trash icons

3. **Special Interests**: Your professional interests
   - Add/remove with + and trash icons

**Tips:**
- Keep summary paragraphs concise (2-3 sentences each)
- Use action words and quantifiable achievements
- List bar admissions in chronological order

#### 💼 Experience

Add and manage your work history:

**For Each Position:**
- Company* (required)
- Position* (required)
- Location
- Start Date (e.g., "May 2021")
- End Date (e.g., "Nov 2024")
- ☑️ Current Position checkbox
- Description (multi-line)

**Actions:**
- **Add Experience**: Click the button at the bottom
- **Remove**: Click trash icon on any experience
- **Reorder**: Edit dates to change order (most recent first)

**Example:**
```
Company: Skillcourt, LLC
Position: Project Manager/Technology Consultant
Location: Deerfield Beach, FL
Start: May 2021
End: Nov 2024
Current: ☐

Description:
Consulting on multi-platform development projects.
Administrating server infrastructure.
Mentoring FIU Capstone development students.
```

#### 🎓 Education

Manage your educational background:

**For Each Institution:**
- Institution* (required)
- Degree* (required)
- Field of Study
- Start Date
- End Date
- Location
- Logo Path (e.g., "/fiu.jpg")
- Activities (dynamic list)

**Activities:**
- Click **+ Add Activity** to add items
- Each activity is a separate line
- Examples: "Dean's List", "Student Government", "Research Assistant"

**Example:**
```
Institution: Florida International University
Degree: Master of Science
Field: Computer Science
Start: Fall 2017
End: Spring 2022
Location: Miami, FL
Logo: /fiu.jpg

Activities:
- Graduate Research Assistant
- Teaching Assistant for Data Structures
- Dean's List (2018-2022)
```

#### 📊 Projects

Track your personal and professional projects:

**For Each Project:**
- Project Name* (required)
- Date (single date, e.g., "Jan 2020")
- Start Date (for date ranges)
- End Date (for date ranges)
- Project URL
- Description

**Tips:**
- Use either "Date" OR "Start/End Date", not both
- Include links to live projects or GitHub repos
- Describe your role and technologies used

**Example:**
```
Name: PluMA
Date: Jan 2020
URL: https://biorg.cs.fiu.edu/pluma/
Description: Bioinformatics pipeline software for genomic analysis
```

#### 💻 Skills

Manage your technical and professional skills:

**For Each Skill:**
- Skill Name* (required)
- Category (optional, e.g., "Programming", "Tools", "Languages")

**Tips:**
- Group related skills with categories
- List most important/proficient skills first
- Include both technical and soft skills

**Examples:**
```
Skill: TypeScript/JavaScript
Category: Programming

Skill: Docker
Category: DevOps

Skill: Spanish
Category: Languages
```

### Saving Changes

1. Fill out the form fields
2. Click **💾 Save Changes** button
3. Wait for success alert
4. Changes are immediately reflected on your public resume

### Form Validation

- **Required fields** are marked with `*`
- **Email fields** validate format
- **Save button** is disabled until form is valid
- **Empty items** in lists are automatically removed

## Tips & Best Practices

### General

- ✅ Save frequently (changes persist in session)
- ✅ Use consistent date formats (e.g., "May 2021")
- ✅ Keep descriptions concise and action-oriented
- ✅ Review public resume after saving changes

### Writing Tips

**Action Verbs:**
- Developed, Implemented, Designed, Led, Managed
- Architected, Optimized, Automated, Collaborated

**Quantify When Possible:**
- "Reduced load time by 40%"
- "Managed team of 5 developers"
- "Processed 10,000+ documents"

**Be Specific:**
- ❌ "Worked on projects"
- ✅ "Developed RESTful API using Node.js and PostgreSQL"

### Dark Mode

The admin UI automatically adapts to your system's dark mode preference:
- Light mode: White backgrounds, dark text
- Dark mode: Dark backgrounds, light text

Toggle your system's dark mode to see the change.

## Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Shift + Tab**: Navigate backwards
- **Enter**: Submit form (when focused on single-line input)
- **Esc**: (Future) Close modals/cancel actions

## Mobile Access

The admin UI is fully responsive:
- **Sidebar**: Collapses on mobile
- **Forms**: Stack vertically
- **Buttons**: Full-width on small screens

Access from any device with a modern browser.

## Troubleshooting

### "Save Changes" Button Disabled

**Cause**: Form validation failed

**Solution**:
1. Check for required fields marked with `*`
2. Verify email format is correct
3. Look for red error messages under fields

### Changes Not Appearing on Public Resume

**Cause**: Browser cache

**Solution**:
1. Hard refresh the public resume page (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Try incognito/private browsing mode

### Session Expired

**Cause**: Auth0 session timeout

**Solution**:
1. Click "Login" again
2. Re-authenticate with Auth0
3. Return to resume editor

### Can't Access Admin Panel

**Cause**: Not authenticated or wrong account

**Solution**:
1. Ensure you're using the correct Auth0 account
2. Check Auth0 configuration in environment files
3. Contact admin if you should have access

## Next Steps

After editing your resume:

1. **Review Public Resume**: Navigate to `/resume` to see your changes
2. **Sync with LinkedIn**: Use LinkedIn MCP tools to import data
3. **Export**: (Future) Download as PDF or JSON
4. **Share**: Send resume link to potential employers

## Related Documentation

- [Admin UI Technical Docs](./ADMIN-UI.md) - Developer documentation
- [LinkedIn Sync](./LINKEDIN-SYNC.md) - Syncing with LinkedIn
- [Resume Service](../src/app/services/resume.service.ts) - Data management

## Support

Need help? Check:
1. This guide
2. Technical documentation
3. Browser console for errors
4. Auth0 logs for authentication issues

---

**Last Updated**: January 4, 2026
**Version**: 1.0.0

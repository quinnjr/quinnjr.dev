# LinkedIn Profile Scraping

This document describes the process and limitations of scraping LinkedIn profile data to update the resume.

## Date: January 4, 2026

## Method Used

### Browser-Based Scraping
Used Cursor's browser MCP tools to navigate to the public LinkedIn profile at `https://www.linkedin.com/in/quinnjosephr/`

### Limitations Encountered

1. **Login Wall**: LinkedIn shows a login dialog for public profiles, limiting visible information
2. **Public Profile Restrictions**: Without authentication, only limited profile data is visible:
   - Basic name and location
   - Current company and education
   - Partial about section
   - Some project information
   - Course listings (visible but extensive scrolling required)

3. **API Limitations**: The LinkedIn MCP API with current access token provides:
   - ✅ Basic profile (firstName, lastName, id)
   - ✅ Profile picture URL
   - ❌ Headline (empty)
   - ❌ Detailed work experience
   - ❌ Education details
   - ❌ Skills list
   - ❌ Certifications

## Data Successfully Extracted

From the public profile view, we were able to extract:

### Basic Information
- **Name**: Joseph Quinn
- **Location**: Miami, Florida, United States
- **Current Company**: Pegasus Heavy Industries LLC
- **Education**: Florida International University
- **Network**: 170 followers, 154 connections

### Projects (New Data)
1. **PluMA**
   - Date: Jan 2020
   - Description: Bioinformatics pipeline software
   - URL: https://biorg.cs.fiu.edu/pluma/

2. **SkillCourt**
   - Duration: May 2021 - Nov 2024
   - Note: This revealed that the SkillCourt engagement ended in Nov 2024

### Courses Visible (Partial List)
- DevOps and SRE Fundamentals (LFS261)
- Discrete Structures (COT 3100)
- Elements (LAW13)
- Evidence (LAW208)
- Federal Income Tax I (LAW105)
- Fundamentals of Computer Systems (CDA 3103)
- Fundamentals of Software Testing (CEN 4072)
- Innovation, Technology, and the Legal Profession (LAW544)
- Intellectual Property Drafting (LAW356)
- Intellectual Property for Business Lawyers (LAW157)
- International Law (LAW312)
- Kubernetes Fundamentals (LFS258)
- Kubernetes for Developers (LFD259)
- Legal Communication and Research I & II (LAW19, LAW29)
- Legal Informatics (LAW308)
- Legal Research Techniques (LAW151)
- Logic for Computer Science (COT 3541)
- Mediation (LAW742)
- Torts (LAW15)
- Trusts and Estates (LAW106)
- Writing and Editing (WRT837)

## Updates Made to Resume

### 1. Experience Section
**Updated**: Skillcourt, LLC end date
- **Before**: May 2021 - Present
- **After**: May 2021 - Nov 2024

### 2. Projects Section (New)
Added a new Projects section to the resume with:
- PluMA project
- SkillCourt project

### 3. Code Changes
- Updated `resume.model.ts` to include `Project` interface
- Updated `resume.service.ts` to include projects array
- Updated `resume.component.html` to render projects dynamically
- Added Projects navigation link to sidebar

## Recommendations

### For Better Data Extraction

1. **LinkedIn API Partner Access**: Apply for LinkedIn Partner Program for full API access
2. **OAuth Flow**: Implement proper OAuth authentication for LinkedIn API
3. **Manual Updates**: Continue updating resume manually or via the ResumeService
4. **Alternative Sources**: Consider importing from:
   - JSON Resume format
   - PDF parsing
   - Structured data entry forms

### For Future Scraping

1. **Authenticated Scraping**: Use LinkedIn credentials for full profile access
2. **Rate Limiting**: Implement delays to avoid rate limiting
3. **Data Validation**: Always verify scraped data before updating
4. **Incremental Updates**: Track what's changed rather than full replacements

## LinkedIn API Access Levels

### Current Access (Basic)
- Profile ID
- First/Last name
- Profile picture
- Limited public data

### Partner Access (Required for Full Data)
- Complete work experience
- Full education history
- Skills and endorsements
- Recommendations
- Certifications
- Publications
- Languages
- Volunteer experience

## Alternative: Manual Data Entry

Given the limitations, the most reliable method is:

1. **Use the ResumeService** to update data programmatically
2. **Create an Admin UI** for easier data entry
3. **Export from LinkedIn** using their data export feature
4. **Parse JSON Resume** format if available

## Files Modified

- `src/app/models/resume.model.ts` - Added Project interface
- `src/app/services/resume.service.ts` - Added projects data, updated SkillCourt end date
- `src/app/pages/resume/resume.component.html` - Added Projects section, made Experience dynamic
- `docs/LINKEDIN-SCRAPING.md` - This documentation

## Testing

To verify the updates:

```bash
# Start the development server
pnpm start

# Navigate to http://localhost:4200/resume
# Verify:
# 1. SkillCourt shows "May 2021 - Nov 2024" (not "Present")
# 2. Projects section appears after Experience
# 3. PluMA and SkillCourt projects are listed
```

## Conclusion

While LinkedIn's public profile provides some data, the most effective approach for maintaining an up-to-date resume is:

1. Use the centralized ResumeService for all updates
2. Manually update when LinkedIn profile changes
3. Consider building an admin interface for easier updates
4. Use LinkedIn's data export feature for bulk updates

The browser-based scraping approach works for extracting visible public data but is limited by LinkedIn's privacy controls and login requirements.

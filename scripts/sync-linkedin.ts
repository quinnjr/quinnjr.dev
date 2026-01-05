#!/usr/bin/env tsx
/**
 * Script to sync LinkedIn profile data with the resume
 * Usage: pnpm tsx scripts/sync-linkedin.ts
 */

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePictureUrl: string;
  vanityName: string;
}

async function fetchLinkedInProfile(): Promise<LinkedInProfile | null> {
  const accessToken = process.env['LINKEDIN_ACCESS_TOKEN'];

  if (!accessToken) {
    console.error('❌ LINKEDIN_ACCESS_TOKEN environment variable is not set');
    return null;
  }

  try {
    // Note: This would need to be implemented with the actual LinkedIn API
    // For now, we'll use the MCP server approach
    console.log('📡 Fetching LinkedIn profile...');
    console.log('⚠️  This script requires the LinkedIn MCP server to be running');
    console.log('💡 Consider using the LinkedIn MCP tools directly in your workflow');

    return null;
  } catch (error) {
    console.error('❌ Error fetching LinkedIn profile:', error);
    return null;
  }
}

async function syncProfile(): Promise<void> {
  console.log('🔄 Starting LinkedIn profile sync...\n');

  const profile = await fetchLinkedInProfile();

  if (!profile) {
    console.log('\n📝 Manual sync steps:');
    console.log('1. Use the LinkedIn MCP tools to fetch your profile');
    console.log('2. Update src/app/services/resume.service.ts with the data');
    console.log('3. Update public/profile_picture.jpg with your LinkedIn photo');
    console.log('4. Update src/index.html structured data if needed\n');
    return;
  }

  console.log('✅ Profile synced successfully!');
  console.log(`   Name: ${profile.firstName} ${profile.lastName}`);
  console.log(`   Headline: ${profile.headline || '(empty)'}`);
  console.log(`   Profile Picture: ${profile.profilePictureUrl ? 'Available' : 'Not available'}`);
}

// Run the sync
syncProfile().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

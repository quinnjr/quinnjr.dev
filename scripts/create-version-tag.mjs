#!/usr/bin/env node
/**
 * Script to create a git tag for the version in package.json
 * Usage: node scripts/create-version-tag.mjs [version]
 * If version is not provided, it will read from package.json
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const packageJsonPath = './package.json';

/**
 * Get version from package.json
 */
function getVersionFromPackage() {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }
}

/**
 * Check if tag already exists
 */
function tagExists(tag) {
  try {
    execSync(`git rev-parse -q --verify "refs/tags/${tag}" > /dev/null 2>&1`, {
      encoding: 'utf-8',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create git tag
 */
function createTag(version) {
  const tagName = `v${version}`;

  if (tagExists(tagName)) {
    console.log(`Tag ${tagName} already exists, skipping.`);
    return false;
  }

  try {
    execSync(`git tag -a "${tagName}" -m "Release version ${version}"`, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    console.log(`✓ Created tag: ${tagName}`);
    return true;
  } catch (error) {
    console.error(`Error creating tag: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Push tag to remote
 */
function pushTag(tag) {
  try {
    execSync(`git push origin "${tag}"`, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    console.log(`✓ Pushed tag: ${tag}`);
  } catch (error) {
    console.error(`Error pushing tag: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Check if the current commit is a merge from a release branch
 */
function isReleaseMerge() {
  try {
    // Get the merge commit message
    const commitMessage = execSync('git log -1 --pretty=%B', {
      encoding: 'utf-8',
    }).trim();

    // Check if it mentions a release branch
    const releasePattern = /(?:Merge|merge).*release\/(?:v?)(\d+\.\d+\.\d+)/i;
    if (releasePattern.test(commitMessage)) {
      return true;
    }

    // Also check if any parent commit is from a release branch
    const parents = execSync('git log -1 --pretty=%P', {
      encoding: 'utf-8',
    })
      .trim()
      .split(/\s+/);

    for (const parent of parents) {
      if (!parent) continue;
      try {
        const branchNames = execSync(
          `git branch -r --contains ${parent} | grep -E 'release/' || true`,
          { encoding: 'utf-8' }
        ).trim();
        if (branchNames) {
          return true;
        }
      } catch {
        // Continue checking other parents
      }
    }

    return false;
  } catch (error) {
    console.warn(`Warning: Could not determine if this is a release merge: ${error.message}`);
    // If we can't determine, assume it might be (safer to tag than not)
    return true;
  }
}

/**
 * Main function
 */
function main() {
  const version = process.argv[2] || getVersionFromPackage();

  // Validate version format
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  if (!semverRegex.test(version)) {
    console.error(`Invalid version format: ${version}`);
    console.error('Version must follow semantic versioning (e.g., 1.2.3)');
    process.exit(1);
  }

  // Check if this appears to be a release merge
  if (!isReleaseMerge()) {
    console.log('This does not appear to be a merge from a release branch, skipping tag creation.');
    process.exit(0);
  }

  const tagName = `v${version}`;
  const created = createTag(tagName);

  if (created) {
    pushTag(tagName);
    console.log(`\n✓ Successfully created and pushed tag: ${tagName}`);
  } else {
    console.log(`\nTag ${tagName} already exists, nothing to do.`);
  }
}

main();


#!/usr/bin/env node
/**
 * Script to update package.json version based on release branch name
 * Usage: node scripts/update-version-from-branch.mjs [branch-name]
 * If branch-name is not provided, it will use the current git branch
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const packageJsonPath = './package.json';

/**
 * Get the current git branch name
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('Error getting current branch:', error.message);
    process.exit(1);
  }
}

/**
 * Extract version from release branch name
 * Examples:
 *   release/v2.0.0 -> 2.0.0
 *   release/1.5.3 -> 1.5.3
 */
function extractVersionFromBranch(branchName) {
  const releaseMatch = branchName.match(/^release\/(.+)$/);
  if (!releaseMatch) {
    return null;
  }

  const version = releaseMatch[1];
  // Validate version format (semver)
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  if (!semverRegex.test(version)) {
    console.error(`Invalid version format: ${version}`);
    console.error('Version must follow semantic versioning (e.g., 1.2.3 or 1.2.3-beta.1)');
    return null;
  }

  return version;
}

/**
 * Update package.json version
 */
function updatePackageVersion(newVersion) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const oldVersion = packageJson.version;

    if (oldVersion === newVersion) {
      console.log(`Version is already ${newVersion}, no update needed.`);
      return false;
    }

    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
    console.log(`✓ Updated package.json version from ${oldVersion} to ${newVersion}`);
    return true;
  } catch (error) {
    console.error('Error updating package.json:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  const branchName = process.argv[2] || getCurrentBranch();
  console.log(`Checking branch: ${branchName}`);

  const version = extractVersionFromBranch(branchName);
  if (!version) {
    console.log(`Not a release branch (${branchName}), skipping version update.`);
    process.exit(0);
  }

  const updated = updatePackageVersion(version);
  if (updated) {
    console.log(`\nVersion updated successfully!`);
    console.log(`Remember to commit this change: git add package.json && git commit -m "chore: update version to ${version}"`);
  }
}

main();


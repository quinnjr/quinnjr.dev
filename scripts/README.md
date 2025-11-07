# Scripts

This directory contains utility scripts for the project.

## update-version-from-branch.mjs

Automatically updates `package.json` version based on release branch name.

### Usage

```bash
# Update version from current branch
node scripts/update-version-from-branch.mjs

# Update version from specific branch name
node scripts/update-version-from-branch.mjs release/v2.1.0
```

### How it works

1. Extracts version from release branch name (e.g., `release/v2.1.0` → `2.1.0`)
2. Validates version follows semantic versioning format
3. Updates `package.json` version field
4. Prints confirmation message

### Automatic execution

The script is automatically executed via the `.husky/post-checkout` hook when:
- Checking out a release branch (e.g., `release/v2.1.0`)
- The branch name matches the pattern `release/*`

### Version format

The version must follow semantic versioning:
- `1.2.3` (standard)
- `1.2.3-beta.1` (with pre-release identifier)
- `1.2.3+build.1` (with build metadata)

### Examples

```bash
# Create a release branch
git checkout -b release/v2.1.0

# The post-checkout hook will automatically update package.json to version 2.1.0

# Or manually run the script
node scripts/update-version-from-branch.mjs release/v2.1.0
```


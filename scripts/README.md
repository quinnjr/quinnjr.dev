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

## create-version-tag.mjs

Automatically creates and pushes a git tag when a release branch is merged to main.

### Usage

```bash
# Create tag from package.json version
node scripts/create-version-tag.mjs

# Create tag with specific version
node scripts/create-version-tag.mjs 2.1.0
```

### How it works

1. Reads version from `package.json` (or uses provided version)
2. Validates version follows semantic versioning format
3. Checks if the current commit is a merge from a release branch
4. Creates an annotated git tag `v{version}` if it doesn't exist
5. Pushes the tag to the remote repository

### Automatic execution

The script is automatically executed via GitHub Actions workflow (`.github/workflows/build-and-deploy.yml`) when:
- A push is made to `main` or `master` branch
- The commit appears to be a merge from a release branch
- The tag does not already exist

### Version format

The version must follow semantic versioning:
- `1.2.3` (major.minor.patch)
- `1.2.3-beta.1` (with pre-release identifier)
- `1.2.3+20240101` (with build metadata)

### Tag format

Tags are created in the format `v{version}` (e.g., `v2.1.0`).

### Examples

```bash
# After merging release/v2.1.0 to main, the workflow will:
# 1. Read version 2.1.0 from package.json
# 2. Create tag v2.1.0
# 3. Push tag to remote repository
```


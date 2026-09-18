<!-- converted from Cursor rules -->

## Cursor rule: `.cursor/rules/angular.mdc`

# Angular Rules

## Component Structure
- Use `OnPush` change detection strategy for better performance
- Implement `OnInit` and `OnDestroy` lifecycle hooks when needed
- Use `@Input()` and `@Output()` with proper typing
- Prefer standalone components over NgModules when possible
- Use `inject()` function instead of constructor injection when appropriate

## Component Selectors
- Component selectors must use `app-` prefix
- Use kebab-case for component selectors: `app-my-component`
- Directive selectors must use `app` prefix with camelCase: `appMyDirective`

## Templates
- Use trackBy functions in `*ngFor` loops for performance
- Avoid complex expressions in templates - move logic to component
- Use async pipe for observables in templates
- Keep template complexity low (max cyclomatic complexity: 5)
- Use structural directives (`*ngIf`, `*ngFor`) appropriately

## Services
- Use `providedIn: 'root'` for singleton services
- Mark services with `@Injectable()` decorator
- Use dependency injection instead of creating instances manually
- Keep services focused on a single responsibility

## RxJS
- Always unsubscribe from subscriptions to prevent memory leaks
- Use `takeUntil` pattern or async pipe when possible
- Prefer operators over nested subscriptions
- Use `shareReplay` for expensive operations that multiple subscribers need

## Forms
- Use reactive forms (`FormBuilder`, `FormGroup`) for complex forms
- Use template-driven forms only for simple forms
- Always validate form inputs
- Provide user-friendly error messages

## Routing
- Use route guards for authentication/authorization
- Use route resolvers for data that must be loaded before navigation
- Keep route configurations in a separate file
- Use lazy loading for feature modules

## Performance
- Use `OnPush` change detection strategy
- Implement `trackBy` functions for `*ngFor`
- Avoid unnecessary change detection triggers
- Use `ChangeDetectorRef.detectChanges()` sparingly
- Prefer observables over event emitters for cross-component communication

## Accessibility
- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Use proper heading hierarchy

## Best Practices
- Keep components small and focused
- Extract reusable logic into services
- Use interfaces for component inputs/outputs
- Avoid direct DOM manipulation - use Angular APIs
- Use Angular CLI for code generation


## Cursor rule: `.cursor/rules/commit-message.mdc`

# Commit Message Rules

## Format
All commit messages must follow the format:
```
<type>: <description>
```

## Types
- **feature**: New feature or functionality
- **bugfix**: Bug fix or error correction
- **release**: Release commit (version bumps, release notes)
- **hotfix**: Critical hotfix for production issues
- **chore**: Maintenance tasks, dependency updates, configuration changes
- **docs**: Documentation changes (README, comments, guides)
- **style**: Code style changes (formatting, whitespace, no logic changes)
- **refactor**: Code refactoring without changing functionality
- **test**: Adding or updating tests
- **perf**: Performance improvements

## Description
- Use imperative mood: "add feature" not "added feature" or "adds feature"
- Keep description concise but descriptive
- Start with lowercase letter
- No period at the end
- Maximum 72 characters for the first line

## Examples
```
feature: add user authentication
bugfix: fix login redirect issue
chore: update dependencies
docs: add API documentation
refactor: simplify error handling
test: add unit tests for blog service
perf: optimize database queries
```

## Multi-line Messages
For detailed explanations, use:
```
feature: add user authentication

- Implement Auth0 integration
- Add login/logout components
- Add route guards for protected routes
- Update navigation component

Closes #123
```

## Breaking Changes
For breaking changes, use:
```
feature: refactor API endpoints

BREAKING CHANGE: API endpoints now require authentication
All endpoints now require Bearer token in Authorization header
```

## Best Practices
- Write clear, descriptive commit messages
- Reference issue numbers when applicable: `Closes #123`
- Group related changes in a single commit
- Don't mix unrelated changes in one commit
- Use present tense, imperative mood


## Cursor rule: `.cursor/rules/git-flow-workflow.mdc`

# Git Flow Workflow

## Branch Strategy

This project follows **Git Flow** branching model. You MUST follow this workflow.

### Main Branches

1. **`main`** - Production-ready code only
   - Only accepts merges from `release/*` or `hotfix/*` branches
   - Protected branch - no direct commits or pushes
   - Tagged with version numbers (e.g., `v2.0.0`)

2. **`develop`** - Integration branch for features
   - Default target for all feature and bugfix branches
   - Where active development happens
   - Protected branch - no direct commits or pushes

### Supporting Branches

1. **`feature/*`** - New features
   - Branch from: `develop`
   - Merge back to: `develop`
   - Examples: `feature/user-authentication`, `feature/dark-mode`

2. **`bugfix/*`** - Bug fixes
   - Branch from: `develop`
   - Merge back to: `develop`
   - Examples: `bugfix/login-redirect`, `bugfix/broken-navigation`

3. **`hotfix/*`** - Critical production fixes
   - Branch from: `main`
   - Merge back to: `main` AND `develop`
   - Examples: `hotfix/security-patch`, `hotfix/critical-error`

4. **`release/*`** - Release preparation
   - Branch from: `develop`
   - Merge back to: `main` AND `develop`
   - Examples: `release/v2.0.0`, `release/v2.1.0`

## Workflow Rules

### ❌ NEVER DO THIS:
```bash
# Never merge feature/bugfix branches directly to main
gh pr create --base main --head feature/my-feature  # WRONG!
gh pr create --base main --head bugfix/my-fix       # WRONG!
```

### ✅ ALWAYS DO THIS:
```bash
# Feature/Bugfix branches go to develop
gh pr create --base develop --head feature/my-feature  # CORRECT!
gh pr create --base develop --head bugfix/my-fix       # CORRECT!

# Only release branches go to main
gh pr create --base main --head release/v2.0.0         # CORRECT!
```

## Complete Workflow Examples

### Adding a New Feature
```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/new-awesome-feature

# 3. Do your work, commit changes
git add .
git commit -m "feature: add awesome feature"

# 4. Push and create PR to DEVELOP
git push origin feature/new-awesome-feature
gh pr create --base develop --head feature/new-awesome-feature

# 5. After PR approval, squash merge to develop
gh pr merge <PR#> --squash
```

### Fixing a Bug
```bash
# Same as feature, but use bugfix/* branch name
git checkout -b bugfix/fix-the-problem
# ... do work ...
gh pr create --base develop --head bugfix/fix-the-problem
```

### Creating a Release
```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v2.1.0

# 2. Update version numbers, changelog, final fixes
npm version 2.1.0
git commit -am "release: prepare v2.1.0"

# 3. Create PR to main, and merge it as a MERGE COMMIT (not squash/rebase) —
#    create-version-tag.mjs looks for that merge commit before it will tag.
git push origin release/v2.1.0
gh pr create --base main --head release/v2.1.0
gh pr merge <PR#> --merge

# 4. Back-merge to develop. This is a pull request too: direct pushes to
#    develop are blocked by both the pre-push hook and the branch ruleset.
gh pr create --base develop --head release/v2.1.0
gh pr merge <PR#> --merge

# 5. Tag the release FROM main. `pnpm release:tag` refuses to tag a commit that
#    origin/main does not contain, so this cannot be run from develop.
git checkout main
git pull origin main
pnpm release:tag
```

### Emergency Hotfix
```bash
# 1. Branch from main (production)
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. Fix the issue
git commit -am "hotfix: fix critical security issue"

# 3. Create PR to main
git push origin hotfix/critical-security-fix
gh pr create --base main --head hotfix/critical-security-fix

# 4. After merge to main, ALSO merge to develop
gh pr create --base develop --head hotfix/critical-security-fix
```

## What Actually Enforces This

Three layers, so the rule holds even when someone (or something) is moving fast.
Until recently only the last of these existed, and the other two were assumed —
which is how a release got tagged off `develop` and several commits landed on
`develop` without review, both against this document.

**1. `.husky/pre-push` (local, immediate)**

- Refuses a direct push to `main`, `master` or `develop`
- Refuses a branch name that is not `feature/`, `bugfix/`, `hotfix/` or `release/`

`develop` was exempt from the first check until it was pointed out that this
document already called it protected. A back-merge is a pull request like
anything else.

**2. Branch rulesets (server-side, cannot be bypassed with `--no-verify`)**

Both `main` and `develop` carry `pull_request`, `non_fast_forward` and
`deletion` rules.

`required_linear_history` was deliberately REMOVED from both. It is
incompatible with this model: git-flow's release and hotfix merges are
`--no-ff` merge commits, and so is the back-merge into `develop`. With linear
history enforced, `gh pr merge --merge` is rejected outright and step 4 of
"Creating a Release" below cannot be performed at all. If you re-enable it, this
workflow stops working — pick one.

**3. `.github/workflows/git-flow.yml` (per pull request)**

Validates the base/head pair on every PR: `feature/*` and `bugfix/*` may only
target `develop`; `release/*` and `hotfix/*` may only target `main` or
`develop`; `develop` may not be merged straight into `main`.

## Merge Strategy

- `feature/*` → `develop`: **squash**. One commit per unit of work.
- `release/*` → `main`: **merge commit** (`gh pr merge --merge`). The merge
  commit is what `scripts/create-version-tag.mjs` looks for before it will tag.
- `hotfix/*` → `main`: **merge commit**, same reason.
- back-merge → `develop`: **merge commit**, to preserve the release history.

## Tagging

`pnpm release:tag` refuses to run unless `HEAD` is contained in `origin/main`,
so a release cannot be tagged from `develop`. Tag only after the release branch
has merged into `main`.

## Summary

**Remember:**
- `feature/*` → `develop`
- `bugfix/*` → `develop`
- `hotfix/*` → `main` (and then `develop`)
- `release/*` → `main` (and then `develop`)
- **NEVER** merge feature/bugfix directly to `main`!


## Cursor rule: `.cursor/rules/git-interaction.mdc`

# Git Interaction Rules

## Branch Naming
All branches must follow git-flow convention:
- **feature/name**: New features (e.g., `feature/user-authentication`)
- **bugfix/name**: Bug fixes (e.g., `bugfix/login-redirect`)
- **hotfix/name**: Critical hotfixes (e.g., `hotfix/security-patch`)
- **release/version**: Release branches (e.g., `release/v2.0.0`)
  - Version must follow semantic versioning (e.g., `release/v2.1.0`, `release/1.5.3`)
  - When creating a release branch, `package.json` version is automatically updated via git hook
  - The version in the branch name should match the intended release version

## Protected Branches
- **Never push directly to `main` or `master`**
- **Never push directly to `develop`**
- Always create a feature/bugfix/hotfix/release branch
- Use pull requests to merge into protected branches

## Commit Practices
- Make small, focused commits
- One logical change per commit
- Write clear commit messages following the commit message format
- Don't commit broken code
- Don't commit commented-out code
- Don't commit debug statements or console.logs (except intentional ones)

## Pull Requests
- Create PRs for all changes to main/develop
- Write descriptive PR titles and descriptions
- Reference related issues in PR description
- Ensure all tests pass before requesting review
- Ensure linting passes before requesting review
- Keep PRs focused and reasonably sized

## Workflow
1. Create a feature branch from main/develop
2. Make changes and commit frequently
3. Push branch to remote
4. Create pull request
5. Address review feedback
6. Merge after approval

## Pre-commit Checks
Before committing:
- Run linter: `pnpm lint`
- Run tests: `pnpm test:server`
- Format code: `pnpm format`
- Check for console.logs and debug statements
- Verify all files are saved

## Pre-push Checks
Before pushing:
- Ensure all tests pass
- Ensure linting passes
- Ensure code is formatted
- Review commit messages
- Verify branch name follows convention

## Git Hooks and Verification

**CRITICAL: NEVER use `--no-verify` or `--skip-hooks` on any git command**

- The project uses Husky git hooks to enforce code quality
- Pre-commit hooks run linting, formatting, and tests
- Pre-push hooks enforce tests and linting before remote pushes
- Commit-msg hooks validate commit message format
- Bypassing these hooks undermines the project's quality standards
- If hooks are failing, fix the underlying issues instead of bypassing them
- The project's integrity and CI/CD pipeline depend on these automated checks
- Never use `git commit --no-verify` or `git push --no-verify`
- Never use `git commit --skip-hooks` or similar bypass flags

## Merge Practices
- Use "Squash and merge" for feature branches
- Use "Merge commit" for release branches
- Delete branch after merge
- Update version numbers appropriately

## Conflict Resolution
- Pull latest changes before starting work
- Rebase feature branches before merging
- Resolve conflicts carefully
- Test after resolving conflicts
- Don't force push to shared branches

## Best Practices
- Commit often with meaningful messages
- Keep commits atomic (one logical change)
- Use `.gitignore` appropriately
- Don't commit sensitive data (API keys, passwords)
- Review changes with `git diff` before committing
- Use `git status` frequently to track changes


## Cursor rule: `.cursor/rules/git-workflow.mdc`

# Git Workflow and Branch Management

## Branch Strategy

When working on any task, **always** follow this branching strategy:

### Branch Naming Convention

Create appropriate feature branches based on the type of work:

- `feature/` - New features or enhancements
  - Example: `feature/tailwind-v4-upgrade`, `feature/user-authentication`
- `bugfix/` - Bug fixes
  - Example: `bugfix/login-redirect`, `bugfix/memory-leak`
- `hotfix/` - Critical production fixes
  - Example: `hotfix/security-patch`, `hotfix/critical-crash`
- `refactor/` - Code refactoring
  - Example: `refactor/api-service`, `refactor/component-structure`
- `chore/` - Maintenance tasks, dependency updates
  - Example: `chore/update-dependencies`, `chore/cleanup-logs`
- `docs/` - Documentation changes
  - Example: `docs/api-documentation`, `docs/readme-update`
- `test/` - Adding or updating tests
  - Example: `test/unit-tests`, `test/e2e-coverage`
- `perf/` - Performance improvements
  - Example: `perf/optimize-queries`, `perf/reduce-bundle-size`

### Branch Naming Rules

- Use lowercase with hyphens
- Be descriptive but concise
- Use the issue/ticket number if available: `feature/PROJ-123-user-auth`

## Workflow Process

### 1. Before Starting Any Work

**ALWAYS check if you're on a feature branch:**

```bash
git branch --show-current
```

**If on `main`, `master`, or `develop`, create a new branch:**

```bash
# Create and switch to new branch
git checkout -b feature/descriptive-name
```

### 2. During Work

- Make logical, atomic commits as you progress
- Don't wait until the end to commit everything

### 3. After Completing Task

**ALWAYS commit your changes when finished:**

```bash
# Stage all relevant files
git add <files>

# Commit with proper format
git commit -m "type: description"
```

### 4. Commit Message Format

Follow the project's commit message convention:

```
<type>: <description>

[optional body]
```

**Valid types:**

- `feature` - New feature
- `bugfix` - Bug fix
- `release` - Release commit
- `hotfix` - Critical hotfix
- `chore` - Maintenance tasks
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `perf` - Performance improvements

**Examples:**

```
feature: add user authentication system
bugfix: fix login redirect issue
chore: update dependencies to latest versions
refactor: simplify API service architecture
```

## Automatic Commit Requirements

### When to Commit

**ALWAYS commit when:**

1. A task is completed
2. A logical unit of work is finished
3. Tests are passing
4. The code is in a stable state
5. Before switching context to a different task

### What to Include

**Stage and commit:**

- All files directly related to the current task
- Updated tests
- Updated documentation if applicable
- Configuration changes

**Do NOT commit:**

- Unrelated changes from other tasks
- Temporary/debug files
- Work-in-progress that breaks tests
- Files unrelated to the current branch's purpose

## Pre-Commit Checks

The project has pre-commit hooks that will automatically run:

1. ✅ Prisma client generation
2. ✅ Code formatting (Prettier)
3. ✅ Linting (ESLint)
4. ✅ Server tests (Vitest)
5. ✅ Commit message validation

**If pre-commit checks fail:**

- Fix the issues
- Stage the fixes
- Attempt commit again

## Branch Cleanup

After the branch is merged:

```bash
# Switch back to main
git checkout main

# Pull latest changes
git pull

# Delete the merged branch locally
git branch -d feature/branch-name

# Delete the remote branch (if pushed)
git push origin --delete feature/branch-name
```

## Complete Workflow Example

```bash
# 1. Starting new work - create branch
git checkout -b feature/add-dark-mode

# 2. Make changes, write code...

# 3. Commit logical units as you go
git add src/styles.scss src/app/theme.service.ts
git commit -m "feature: implement dark mode theme service"

# 4. Continue working...
git add src/app/components/theme-toggle.component.ts
git commit -m "feature: add dark mode toggle component"

# 5. Task complete - final commit if needed
git add README.md
git commit -m "docs: add dark mode usage instructions"

# 6. Push to remote
git push -u origin feature/add-dark-mode

# 7. Create PR (via GitHub/GitLab UI or CLI)
```

## Important Reminders

### ⚠️ Never Work Directly on Main/Master

- **ALWAYS** create a feature branch
- **NEVER** commit directly to `main`, `master`, or `develop`
- If you accidentally commit to main, create a branch and reset main:
  ```bash
  git branch feature/my-work
  git reset --hard origin/main
  git checkout feature/my-work
  ```

### ✅ Always Commit When Done

- **DO** commit completed work immediately
- **DO** write clear, descriptive commit messages
- **DO** ensure tests pass before committing
- **DO** stage only relevant files

### 🔄 Commit Often

- Small, frequent commits are better than large ones
- Each commit should represent a logical change
- Makes code review easier
- Makes debugging easier with `git bisect`

## Agent Instructions

When you (the AI agent) complete any task:

1. **Check current branch** - If on main/master/develop, create appropriate feature branch
2. **Stage relevant files** - Only files related to the current task
3. **Write descriptive commit** - Follow the commit message format
4. **Handle pre-commit hooks** - Fix any issues that arise
5. **Confirm commit success** - Show commit hash and summary
6. **Report status** - Tell user about the branch and commit

**Example agent workflow:**

```
Task: "Add dark mode support"

1. git checkout -b feature/dark-mode
2. [Make changes to files]
3. git add [relevant files]
4. git commit -m "feature: implement dark mode with theme toggle"
5. Report: "✅ Committed to feature/dark-mode (commit abc1234)"
```

## Exception Cases

### Working on Documentation Only

For small documentation fixes, you may use:

- `docs/update-readme` or similar branch
- Single commit for the change

### Hotfixes

For critical production issues:

- Branch from `main`: `git checkout -b hotfix/critical-issue`
- Commit immediately after fix
- Push and merge ASAP

### Exploratory/Experimental Work

For experimental changes:

- Use `experiment/` prefix: `experiment/new-architecture`
- Commit frequently to save progress
- May be discarded or cherry-picked later

## Summary Checklist

Before finishing any task, ensure:

- [ ] Created appropriate feature/bugfix/etc branch
- [ ] Made logical, atomic commits during work
- [ ] All tests passing
- [ ] Code formatted and linted
- [ ] Commit messages follow format
- [ ] Final commit includes all task-related changes
- [ ] Branch ready for PR or merge

---

**Remember:** Good git hygiene makes collaboration easier, debugging faster, and code review more efficient. Always branch, always commit!


## Cursor rule: `.cursor/rules/linting.mdc`

# Linting Rules

## ESLint Configuration
- Use TypeScript ESLint with strict type checking
- Enable all security rules
- Enable code quality rules (SonarJS)
- Enforce import organization
- Integrate Prettier for formatting

## TypeScript Rules
- **Error**: `no-explicit-any`, `no-unsafe-*`, `no-floating-promises`
- **Error**: `prefer-nullish-coalescing`, `prefer-optional-chain`
- **Error**: `consistent-type-imports`, `switch-exhaustiveness-check`
- **Warning**: `prefer-on-push-component-change-detection` (Angular)
- **Off**: `explicit-function-return-type` (too strict for existing codebase)

## Import Organization
- Group imports: builtin → external → internal → parent → sibling → index
- Alphabetize imports within groups
- Add newlines between import groups
- Use type-only imports: `import type { ... }`
- Detect and prevent import cycles (max depth: 3)

## Security Rules
- Detect object injection vulnerabilities
- Detect unsafe regex patterns
- Detect eval usage (error)
- Detect timing attack vulnerabilities (warn)
- Detect unsafe random number generation (error)

## Code Quality (SonarJS)
- Cognitive complexity limit: 15
- Duplicate string threshold: 3
- Detect identical functions
- Detect redundant code
- Detect unused collections

## Angular Rules
- Enforce component/directive selector prefixes
- Require lifecycle interfaces
- Enforce output naming conventions
- Template accessibility rules
- Template complexity limits

## Prettier Integration
- Enforce consistent code formatting
- Single quotes for strings
- Semicolons required
- Trailing commas (ES5)
- 100 character line width
- 2 space indentation

## Pre-commit Hook
The pre-commit hook runs:
1. Prisma client generation
2. Code formatting (Prettier)
3. Linting (ESLint)
4. Server tests

## Fixing Issues
- Run `pnpm lint:fix` to auto-fix issues
- Run `pnpm format` to format code
- Fix remaining issues manually
- Review auto-fixes before committing

## Best Practices
- Fix linting errors immediately
- Don't disable rules without good reason
- Use `eslint-disable` comments sparingly
- Add comments explaining why rules are disabled
- Keep linting configuration consistent across the project

## Common Issues and Fixes

### Type Safety
- Replace `any` with proper types
- Use type guards for `unknown` types
- Add type assertions where needed

### Promise Handling
- Add `await` to async operations
- Add `.catch()` for error handling
- Use `void` for intentionally unhandled promises

### Nullish Coalescing
- Replace `||` with `??` for default values
- Use `??` when checking for null/undefined specifically

### Import Organization
- Group imports correctly
- Add newlines between groups
- Use type-only imports for types

### Angular Best Practices
- Add `OnPush` change detection
- Use lifecycle interfaces
- Fix template accessibility issues


## Cursor rule: `.cursor/rules/no-auto-markdown.mdc`

# No Automatic Markdown Generation

## Core Rule

**DO NOT create, generate, or write markdown files unless explicitly requested by the user.**

## What This Means

### ❌ Never Auto-Generate These Files

- `README.md` (unless user explicitly asks)
- `CHANGELOG.md` (unless user explicitly asks)
- `CONTRIBUTING.md` (unless user explicitly asks)
- `MIGRATION.md` (unless user explicitly asks)
- `UPGRADE.md` (unless user explicitly asks)
- Any `*-GUIDE.md` files (unless user explicitly asks)
- Any `*-INSTRUCTIONS.md` files (unless user explicitly asks)
- Any documentation files with `.md` extension (unless user explicitly asks)
- Summary documents after completing tasks (unless user explicitly asks)

### ✅ Only Create Markdown When

The user explicitly requests it with phrases like:

- "Create a README"
- "Write documentation for..."
- "Generate a changelog"
- "Make a markdown file explaining..."
- "Document this in a README"
- "Create an upgrade guide"

### Exceptions

The following are acceptable to create/modify without explicit request:

- **Cursor rules** (`.cursor/rules/*.mdc` files) - These are project configuration
- **Inline code comments** - Regular code documentation
- **Commit messages** - Part of git workflow
- **Existing markdown files** - If user asks to update or fix existing files

## Why This Rule Exists

1. **Avoid Clutter** - Projects don't need documentation files after every task
2. **User Control** - User decides when documentation is needed
3. **Stay Focused** - Complete the actual work, not documentation about the work
4. **Less Noise** - Reduces unnecessary file creation

## Examples

### ❌ Bad - Auto-Generated Documentation

```
Agent: "I've upgraded Tailwind to v4. Let me create an UPGRADE.md
        documenting the changes..."
```

**Wrong!** User didn't ask for documentation.

### ✅ Good - Focus on the Work

```
Agent: "I've upgraded Tailwind to v4. Here's what changed:
        - Updated package.json
        - Converted styles.scss to v4 syntax
        - All builds passing"
```

**Correct!** Provide summary in conversation, no markdown file.

### ✅ Good - User Requested Documentation

```
User: "Create a README explaining the Tailwind upgrade"
Agent: "I'll create a README.md documenting the upgrade..."
```

**Correct!** User explicitly asked for it.

## What to Do Instead

When completing a task, provide information in the **conversation**:

### Instead of Creating Files

```markdown
# BAD - Creating TASK-SUMMARY.md
```

### Provide Info in Response

```
Good approach - Just tell the user:

✅ Task completed!

Changes made:
- Updated dependencies
- Fixed configuration
- All tests passing

Commit: abc1234
Branch: feature/task-name
```

## Documentation That IS Allowed

### 1. Code Comments

```typescript
// This is fine - inline documentation
function processData() {
  // Explain complex logic here
}
```

### 2. JSDoc/TSDoc

```typescript
/**
 * This is fine - API documentation in code
 * @param data The input data
 * @returns Processed result
 */
function process(data: Data): Result {
  // ...
}
```

### 3. Existing Files

If `README.md` already exists and needs updating:

- User asks: "Update the README with the new API"
- This is fine - modifying existing file per request

### 4. Cursor Rules

Creating `.cursor/rules/*.mdc` files is always allowed:

- These are project configuration
- Part of the development environment
- Not "documentation" in the traditional sense

## Special Cases

### Configuration Files (Not Markdown)

These are ALWAYS fine to create when needed:

- `.prettierrc`
- `.eslintrc.json`
- `tsconfig.json`
- `package.json`
- `.gitignore`
- etc.

These are not documentation - they're configuration.

### When in Doubt

Ask yourself:

1. Did the user explicitly request this file?
2. Is this a `.cursor/rules/*.mdc` file?
3. Am I modifying an existing file the user asked about?

If all answers are "no" → **Don't create the markdown file**

## Implementation for AI Agents

When you (the AI assistant) complete a task:

### ✅ DO

- Provide a summary in the conversation
- List what changed
- Show commit information
- Explain any important details
- Offer to create documentation if user wants it

### ❌ DON'T

- Create `README.md` automatically
- Create `UPGRADE.md` automatically
- Create `MIGRATION.md` automatically
- Create any `*.md` file automatically
- Create summary documents
- Create guide documents

### Example Response Pattern

```
✅ Tailwind v4 upgrade complete!

Changes:
- package.json: Updated to v4.1.18
- styles.scss: Converted to @import syntax
- tailwind.config.mjs: Simplified config

Build status: ✅ Passing
Tests: ✅ 25/25 passing
Commit: abc1234
Branch: feature/tailwind-v4-upgrade

[Don't create TAILWIND-UPGRADE.md unless user asks]
```

## Reminder Checklist

Before creating any `.md` file, verify:

- [ ] User explicitly requested this file
- [ ] OR this is a `.cursor/rules/*.mdc` file
- [ ] OR this is modifying an existing file per user request

If none apply → **Don't create the file**

---

**Summary:** Focus on doing the work and communicating results. Let the user decide when they need written documentation.


## Cursor rule: `.cursor/rules/no-verify-forbidden.mdc`

# Never Use --no-verify Flag

## Rule
**NEVER use `--no-verify` flag with any git commands.**

## Rationale
The `--no-verify` flag bypasses:
- Pre-commit hooks (linting, formatting, tests)
- Pre-push hooks (additional validation)
- Commit message validation
- Security checks

These hooks are essential for maintaining code quality and preventing broken code from entering the repository.

## Correct Usage

### ❌ WRONG - Never do this:
```bash
git push --no-verify
git commit --no-verify
git push origin main --no-verify
```

### ✅ CORRECT - Always let hooks run:
```bash
git push
git commit -m "message"
git push origin main
```

## What to Do Instead

If hooks are failing:
1. **Fix the actual issue** - Don't bypass validation
2. **Review the error messages** - They indicate real problems
3. **Run commands locally** - `pnpm lint:fix`, `pnpm test`, `pnpm format`
4. **Only commit when all checks pass**

## Exceptions
There are **NO exceptions** to this rule. If you need to bypass hooks, you must:
1. Explicitly ask the user for permission
2. Explain why it's necessary
3. Get explicit user approval before proceeding

## Why This Matters
- Ensures code quality standards are met
- Prevents broken builds in CI/CD
- Maintains commit message consistency
- Catches issues early before they reach the repository
- Protects against accidentally committing secrets or sensitive data


## Cursor rule: `.cursor/rules/pr-merge-policy.mdc`

# Pull Request Merge Policy

## Rule
**NEVER merge Pull Requests until ALL GitHub Actions checks have completed successfully.**

## Rationale
Merging PRs before CI/CD checks complete can introduce:
- **Broken code** into protected branches (`main`, `develop`)
- **Failed tests** that aren't caught until after merge
- **Build failures** that block deployments
- **Security vulnerabilities** that bypass linting/security scans

## Best Practices

### ✅ CORRECT Workflow:
1. **Create PR**: `gh pr create --base develop --head feature/my-feature`
2. **Wait for Checks**: Monitor GitHub Actions until all checks pass
   ```bash
   gh pr checks <PR_NUMBER>
   ```
3. **Verify All Green**: Ensure all required checks show "pass"
   - Client Tests
   - Server Tests
   - E2E Tests
   - Linting
   - Build
4. **Merge PR**: Only after all checks pass
   ```bash
   gh pr merge <PR_NUMBER> --squash --delete-branch
   ```

### ❌ WRONG - Never do this:
```bash
# DON'T merge immediately after creating PR
gh pr create ... && gh pr merge --auto

# DON'T merge with failing checks
gh pr merge <PR_NUMBER>  # when checks are still running or failed
```

## Monitoring PR Checks

### Check PR Status
```bash
# View all checks for a PR
gh pr checks <PR_NUMBER>

# Watch checks in real-time
gh pr checks <PR_NUMBER> --watch

# View PR details
gh pr view <PR_NUMBER>
```

### Interpreting Check Results
- ✅ **pass** - Check completed successfully
- ❌ **fail** - Check failed, must be fixed before merging
- 🟡 **pending** - Check is still running, wait for completion
- ⏸️ **skipped** - Check was skipped (verify this is intentional)

## GitHub Branch Protection

### Current Configuration
Both `main` and `develop` branches have branch protection enabled, but **required status checks are not configured**.

### Required Status Checks to Enable

Navigate to: **Settings → Branches → Branch protection rules** for each branch

#### For `main` branch:
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Required checks:
  - `Client Tests`
  - `Server Tests`
  - `E2E Tests`
  - `Linting`
  - `Build`

#### For `develop` branch:
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Required checks:
  - `Client Tests`
  - `Server Tests`
  - `E2E Tests`
  - `Linting`
  - `Build`

### Enable via GitHub CLI (Optional)
```bash
# Enable required status checks for main
gh api --method PUT /repos/quinnjr/quinnjr.dev/branches/main/protection \
  --field required_status_checks='{"strict":true,"checks":[{"context":"Client Tests"},{"context":"Server Tests"},{"context":"E2E Tests"}]}'

# Enable required status checks for develop
gh api --method PUT /repos/quinnjr/quinnjr.dev/branches/develop/protection \
  --field required_status_checks='{"strict":true,"checks":[{"context":"Client Tests"},{"context":"Server Tests"},{"context":"E2E Tests"}]}'
```

## Auto-Merge Feature

The `--auto` flag can be used **IF AND ONLY IF** branch protection with required status checks is enabled:

```bash
# Safe to use --auto when branch protection is configured
gh pr merge <PR_NUMBER> --squash --delete-branch --auto
```

This will queue the PR to merge automatically once all required checks pass.

## Emergency Situations

In rare emergency situations where a hotfix is critical and checks are failing due to unrelated issues:

1. **Document the reason** in the PR description
2. **Get explicit approval** from team lead
3. **Create a follow-up issue** to fix the failing checks
4. **Only then** consider bypassing checks

**NEVER bypass checks without documentation and approval.**

## Summary

- ✅ Always wait for all GitHub Actions checks to complete
- ✅ Verify all checks show "pass" before merging
- ✅ Use `gh pr checks <PR_NUMBER>` to monitor status
- ✅ Enable branch protection with required status checks
- ❌ Never merge with failing or pending checks
- ❌ Never use `--auto` without branch protection configured


## Cursor rule: `.cursor/rules/testing.mdc`

# Testing Rules

## Test Structure
- Use `describe` blocks to group related tests
- Use descriptive test names: `it('should do something when condition is met')`
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests focused on a single behavior
- Use `beforeEach` and `afterEach` for setup/teardown

## Jest Configuration
- Use `jest-mock-extended` for mocking Prisma Client
- Create deep mocks with `mockDeep<Type>()` for complex objects
- Use `DeepMockProxy<Type>` for type-safe mocks
- Mock external dependencies before importing modules

## Test Data
- Use realistic test data that matches production types
- Create test fixtures/factories for reusable test data
- Use `as never` type assertion for partial mock data when needed
- Keep test data minimal but complete

## Mocking
- Mock external dependencies (database, APIs, file system)
- Use `jest.fn()` for function mocks
- Use `jest.mock()` at the top level for module mocks
- Reset mocks in `beforeEach` to ensure test isolation
- Verify mock calls with `toHaveBeenCalledWith()`

## Async Testing
- Always `await` async operations in tests
- Use `async/await` instead of `.then()` in tests
- Handle promise rejections with `rejects.toThrow()`
- Use `waitFor` for DOM updates in Angular tests

## Assertions
- Use specific matchers: `toBe()`, `toEqual()`, `toContain()`, etc.
- Test both positive and negative cases
- Verify error handling and edge cases
- Check that errors are thrown with correct messages

## Coverage
- Aim for high code coverage (>80%)
- Test edge cases and error paths
- Don't test implementation details, test behavior
- Use coverage reports to identify untested code

## Best Practices
- Keep tests independent - no shared state between tests
- Use descriptive variable names in tests
- Avoid testing multiple things in one test
- Clean up resources in `afterEach`
- Use test utilities and helpers to reduce duplication

## Angular Testing
- Use Angular testing utilities (`TestBed`, `ComponentFixture`)
- Test component inputs, outputs, and events
- Test template rendering and user interactions
- Mock services and dependencies
- Test routing and navigation

## Server Testing
- Mock Prisma Client using `jest-mock-extended`
- Test service methods in isolation
- Test error handling and edge cases
- Verify database interactions without hitting real database
- Use proper type assertions for mock data


## Cursor rule: `.cursor/rules/typescript.mdc`

# TypeScript Rules

## Type Safety
- Always use explicit types instead of `any`
- Use `unknown` when the type is truly unknown, then narrow with type guards
- Prefer `interface` over `type` for object shapes
- Use type-only imports: `import type { ... }` when importing only types
- Avoid `@ts-ignore` and `@ts-nocheck` - fix the underlying issue instead

## Type Definitions
- Define interfaces for all data structures
- Use discriminated unions for related types with different shapes
- Prefer readonly properties when values shouldn't change
- Use `const` assertions for literal types: `as const`

## Null Safety
- Use nullish coalescing (`??`) instead of logical OR (`||`) for default values
- Use optional chaining (`?.`) to safely access nested properties
- Explicitly handle `null` and `undefined` cases
- Avoid non-null assertions (`!`) - handle nullability properly

## Async/Promises
- Always handle promise rejections with `.catch()` or `try/catch`
- Use `async/await` instead of `.then()` chains when possible
- Mark functions as `async` only when they use `await`
- Use `void` operator for intentionally unhandled promises: `void promiseFunction()`

## Code Organization
- Group imports: builtin → external → internal → parent → sibling → index
- Use consistent import ordering (alphabetical within groups)
- Separate type imports from value imports
- Keep functions focused and single-purpose

## Best Practices
- Use `const` for variables that don't change
- Use arrow functions for callbacks to preserve `this` context
- Prefer template literals over string concatenation
- Use object destructuring for cleaner code
- Prefer `switch` statements with exhaustiveness checking for multiple conditions

## Error Handling
- Always type error parameters: `catch (error: unknown)`
- Use type guards to narrow error types
- Provide meaningful error messages
- Log errors appropriately (console.error for errors, console.warn for warnings)

## Performance
- Avoid unnecessary type assertions
- Use `as const` for immutable data structures
- Prefer `Map` and `Set` for large collections
- Use `readonly` arrays when arrays shouldn't be mutated


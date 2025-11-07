# Professional Linting Configuration

This project uses a comprehensive, professional-level linting setup to ensure code quality, security, and maintainability.

## Tools Configured

### ESLint
- **TypeScript ESLint**: Strict type checking and TypeScript best practices
- **Angular ESLint**: Angular-specific rules and best practices
- **Import Plugin**: Import organization and validation
- **Security Plugin**: Security vulnerability detection
- **SonarJS Plugin**: Code quality and complexity analysis
- **Prettier Integration**: Code formatting enforcement

### Prettier
- Automatic code formatting
- Consistent code style across the project
- Integrated with ESLint

## Key Rules Enabled

### TypeScript Strict Rules
- `no-explicit-any`: Prevents use of `any` type
- `no-unsafe-*`: Prevents unsafe type operations
- `no-floating-promises`: Ensures promises are handled
- `prefer-nullish-coalescing`: Encourages `??` over `||`
- `prefer-optional-chain`: Encourages `?.` operator
- `consistent-type-imports`: Enforces type-only imports
- `switch-exhaustiveness-check`: Ensures switch statements are exhaustive

### Import Organization
- Automatic import sorting
- Grouped imports (builtin → external → internal → parent → sibling)
- Alphabetical ordering within groups
- Newlines between groups
- Cycle detection (max depth: 3)

### Security Rules
- Detects object injection vulnerabilities
- Detects unsafe regex patterns
- Detects eval usage
- Detects timing attack vulnerabilities
- Detects unsafe random number generation

### Code Quality (SonarJS)
- Cognitive complexity limit (15)
- Duplicate string detection
- Identical function detection
- Redundant code detection

### Angular Best Practices
- Component selector enforcement
- Lifecycle interface usage
- OnPush change detection (warning)
- Output naming conventions
- Template accessibility rules

## Usage

### Run Linter
```bash
pnpm lint
```

### Auto-fix Issues
```bash
pnpm lint:fix
```

### Format Code
```bash
pnpm format
```

### Check Formatting
```bash
pnpm format:check
```

## Current Status

The linting configuration has been added, but there are **56 errors and 17 warnings** that need to be fixed. These are primarily:

1. **Type Safety Issues**: `any` types, unsafe operations
2. **Promise Handling**: Missing `await` or error handling
3. **Nullish Coalescing**: Using `||` instead of `??`
4. **Import Organization**: Import order and grouping
5. **Angular Best Practices**: OnPush change detection

## Fixing Issues

### Priority 1: Type Safety
- Replace `any` types with proper types
- Add type assertions where needed
- Fix unsafe type operations

### Priority 2: Promise Handling
- Add `await` to async operations
- Add error handling to promises
- Use `void` operator for intentionally unhandled promises

### Priority 3: Code Quality
- Replace `||` with `??` where appropriate
- Fix import organization
- Add explicit return types (optional, currently disabled)

### Priority 4: Angular Optimizations
- Add `OnPush` change detection to components
- Fix template accessibility issues

## Pre-commit Hook

The pre-commit hook currently:
1. Generates Prisma client
2. Formats code with Prettier
3. Runs linter (currently allows errors for gradual adoption)
4. Runs tests

**Note**: Linting errors are currently allowed in pre-commit to enable gradual adoption. Once issues are fixed, the hook should be updated to block commits with linting errors.

## VSCode Integration

VSCode settings are configured for:
- Auto-formatting on save
- ESLint auto-fix on save
- Prettier as default formatter

## Next Steps

1. Fix existing linting errors incrementally
2. Enable stricter rules as codebase improves
3. Re-enable strict linting in pre-commit hook
4. Consider adding `lint-staged` for faster pre-commit checks


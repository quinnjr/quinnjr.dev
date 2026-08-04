# quinnjr.dev

Personal site and content management system: an Angular application with server-side rendering, a
GraphQL API, and a Postgres-backed blog.

## Tech Stack

- **Framework**: Angular 22 with SSR (Express + `@angular/ssr`)
- **Runtime**: Node.js 24.15+ (or 22.22.3+)
- **Package Manager**: pnpm 10.13.1+
- **Database**: PostgreSQL with Prisma ORM
- **API**: GraphQL (Pothos schema builder + GraphQL Yoga), consumed via Apollo Angular
- **Authentication**: local email/password — argon2id hashing (`@node-rs/argon2`) and a self-signed
  HS256 JWT (`jose`)
- **Styling**: Tailwind CSS v4 with Flowbite components
- **Testing**: Vitest (client and server) and Playwright
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 24.15 or higher (22.22.3+ also satisfies the Angular 22 CLI)
- pnpm 10.13.1 or higher
- PostgreSQL 16 (or Docker and Docker Compose, which provide one)

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate
```

### Development Server

Run `pnpm start` for a dev server. Navigate to `http://localhost:4200/`. The application will
automatically reload if you change any of the source files.

Note that the `development` build configuration sets `"ssr": false`, so the Express layer
(`/graphql`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/healthz`, `/api/github/*`) is **not**
served by `pnpm start`. Build and run the SSR server to exercise those routes — see
[Running SSR Locally](#running-ssr-locally).

### Environment Setup

| Variable              | Required             | Purpose                                                              |
| --------------------- | -------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`        | yes                  | PostgreSQL connection string used by Prisma                          |
| `JWT_SECRET`          | yes                  | Signing secret for the HS256 session token                           |
| `WEBAUTHN_RP_ID`      | yes, unless served from `quinnjr.dev` | WebAuthn relying-party ID (default `quinnjr.dev`)   |
| `WEBAUTHN_ORIGIN`     | yes, unless served from `quinnjr.dev` | Comma-separated origins accepted in a ceremony (default `https://$WEBAUTHN_RP_ID`) |
| `WEBAUTHN_RP_NAME`    | no                   | Display name shown by the authenticator (default `quinnjr.dev`)      |
| `SEED_ADMIN_EMAIL`    | seeding              | Email for the admin user created by `pnpm prisma:seed`               |
| `SEED_ADMIN_PASSWORD` | seeding              | Password for that admin user — no default; the seed exits if unset   |
| `PORT`                | no                   | SSR server port (default `4000`)                                     |
| `SITE_ORIGIN`         | no                   | Canonical origin emitted in sitemap/robots/llms (default the domain) |
| `SSR_ALLOWED_HOSTS`   | no                   | Comma-separated hostnames accepted by the SSR host guard             |
| `SSR_TRUST_PROXY`     | no                   | Reverse-proxy hops in front of the server (default `1`). Sets Express `trust proxy`, which is what makes `req.ip` — and so the rate limiter's per-IP bucket — reflect the real caller rather than a forgeable `X-Forwarded-For` entry. Use `0` when nothing proxies the process |
| `GITHUB_TOKEN`        | no                   | GitHub API token for `/api/github/*`; unset means the anonymous 60 req/hr limit |
| `ADMIN_EMAIL`         | e2e                  | Credentials the SSR passkey e2e signs in with (`e2e/ssr/passkey.spec.ts`) |
| `ADMIN_PASSWORD`      | e2e                  | As above; the spec skips itself when either is unset                 |

There is no external identity provider. Sign-in starts with the GraphQL `login` mutation, and a
session token — once earned — is stored in `localStorage` under `auth_token`. `login` itself
**never** returns a session token, for any account: a passkey is mandatory, so sign-in always
continues through a second step. See [Passkeys / second factor](#passkeys--second-factor).

> **Changing `WEBAUTHN_RP_ID` invalidates every enrolled credential, with no migration path.** A
> credential created under one relying-party ID cannot be asserted under another, so every existing
> passkey becomes unusable and has to be re-enrolled. `WEBAUTHN_ORIGIN` is compared verbatim against
> the browser's origin, carrying the scheme and any non-default port — a wrong value silently breaks
> every ceremony. Both default to the production domain, so any deployment **not** served from
> `quinnjr.dev` (local SSR, Docker Compose, staging) must set them or no passkey will ever work.

### Passkeys / second factor

A passkey (WebAuthn) is a **mandatory** second factor. `login` never returns a session token; it
returns one of exactly two short-lived tickets, and which one depends on whether the account
already has a credential:

1. `login(email:, password:)` returns an `AuthPayload` whose `token` and `user` are **always**
   `null`. `mfaToken` carries a five-minute ticket proving the password was correct, and one of two
   flags says what to do with it:
   - `mfaRequired: true` — the account has at least one passkey. The ticket is scoped `assert`.
   - `enrolmentRequired: true` — the account has none. The ticket is scoped `enrol`, and the only
     way to finish signing in is to register a credential now.
2. **Assertion path** (`mfaRequired`): `beginPasskeyAuthentication(mfaToken:)` returns the assertion
   options, the browser runs the ceremony, and `verifyPasskey(mfaToken:, response:)` returns the
   `AuthPayload` carrying the session `token`.
3. **Enrolment path** (`enrolmentRequired`): `beginPasskeyEnrolment(mfaToken:)` returns creation
   options, and `completePasskeyEnrolment(mfaToken:, response:, name:)` stores the credential and
   returns the session `token`. Both are `public` scope by necessity — there is no session yet.

The two ticket scopes are **not** interchangeable, and this is load-bearing rather than cosmetic:
both are signed with the same key, so without the scope claim a caller who knew only the password of
a passkey-protected account could spend their `assert` ticket on `completePasskeyEnrolment`,
register their own authenticator, and be handed a session. Each enrolment resolver additionally
re-checks the database and refuses if the account already holds a credential.

The `mfaToken` is valid for **5 minutes** and is burned after a handful of failed attempts; a
pending challenge expires on the same window. Once either lapses, start again from `login`.

Enrolment from an existing session (`beginPasskeyRegistration` → `finishPasskeyRegistration`) is
driven from `/admin/security` and is how a spare key is added. Passkeys are listed by the `passkeys`
query, which only ever returns the caller's own.

Removing the **last** passkey does not return the account to password-only sign-in — nothing does.
It returns the account to the mandatory-enrolment state, so the next sign-in stops and demands a new
credential. `deletePasskey` therefore refuses to remove the last one unless the caller passes
`confirmRemoveLastPasskey: true`: the owner may be left unable to sign in at all from a device
without WebAuthn, and without the gate a stolen session token could strip the real owner's
credential and enrol the attacker's in its place.

> **The seeded admin has no passkey.** `pnpm prisma:seed` creates the account with a password only,
> so the very first sign-in goes through the enrolment path above and must be done from a device
> that can create a passkey.

## Development

### Code Scaffolding

Run `pnpm ng generate component component-name` to generate a new component. You can also use
`pnpm ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

```bash
# Production build (the default configuration)
pnpm build

# Development build
pnpm build --configuration development
```

The build artifacts will be stored in the `dist/` directory.

### Running SSR Locally

After building, run the SSR server (it needs a reachable database):

```bash
pnpm build
DATABASE_URL="postgresql://quinnjr:quinnjr@localhost:5432/quinnjr?schema=public" \
  JWT_SECRET="dev-secret" \
  pnpm serve:ssr:quinnjr.dev
```

The server listens on `http://localhost:4000`.

## Testing

### Unit Tests

```bash
# Run Angular unit tests (Vitest, via the @angular/build:unit-test builder)
pnpm test

# Run with coverage (written to ./coverage)
pnpm test:coverage

# Run server-side unit tests (Vitest, ./coverage/server)
pnpm test:server

# Watch mode for server tests
pnpm test:server:watch

# Server tests with coverage
pnpm test:server:coverage
```

### End-to-End Tests

```bash
# Run E2E tests (Playwright)
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run in headed mode
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

`pnpm test:e2e` starts `ng serve` (no SSR). The SSR/Express routes have their own Playwright
project, which skips unless it is pointed at a running SSR server:

```bash
pnpm build
DATABASE_URL="postgresql://..." pnpm serve:ssr:quinnjr.dev &
PLAYWRIGHT_SSR_BASE_URL=http://localhost:4000 pnpm exec playwright test --project=ssr-routes
```

### Run All Tests

```bash
pnpm test:all
```

This runs server tests, unit tests, and E2E tests sequentially.

## Code Quality

### Linting

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

Git hooks (husky) run on every commit and push: the pre-commit hook formats the staged files and
runs lint plus the server suite; the pre-push hook additionally runs the Angular unit suite. Do not
bypass them with `--no-verify` — fix the failing check instead.

## Database

### Prisma Commands

```bash
# Generate Prisma client
pnpm prisma:generate

# Create and apply a migration (development)
pnpm prisma:migrate

# Apply existing migrations without generating new ones (production)
pnpm prisma:migrate:deploy

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Seed the database
pnpm prisma:seed

# Reset database (WARNING: deletes all data)
pnpm prisma:reset

# Create an additional user interactively (prompts for email/password/role)
pnpm user:create

# Print the built GraphQL SDL to schema.graphql
pnpm schema:print

# Regenerate the typed client operations (runs schema:print first)
pnpm codegen
```

### Database Migrations

#### Development (local Postgres)

```bash
export DATABASE_URL="postgresql://quinnjr:quinnjr@localhost:5432/quinnjr?schema=public"
pnpm prisma:migrate
SEED_ADMIN_EMAIL="you@example.com" SEED_ADMIN_PASSWORD="…" pnpm prisma:seed
```

#### Production (Docker)

The `app` service already runs `prisma migrate deploy` on start. To run it by hand:

```bash
docker-compose exec app pnpm prisma:migrate:deploy
```

Seeding cannot run inside the container: `pnpm prisma:seed` is `tsx prisma/seed.ts`, and the
production image installs `--prod` (no `tsx`) and ships only the manifests, `prisma/`, and `dist/` —
`prisma/seed.ts` also imports from `src/server/`, which is not in the image. Seed from a development
checkout pointed at the production database instead:

```bash
DATABASE_URL="postgresql://…production…" \
  SEED_ADMIN_EMAIL="you@example.com" SEED_ADMIN_PASSWORD="…" \
  pnpm prisma:seed
```

## Docker Deployment

### Production with Docker Compose

Build and run the application:

```bash
# Build and start the service
docker-compose up -d

# Stop the service
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild after code changes
docker-compose up -d --build
```

`docker-compose.yml` brings up `postgres:16-alpine` alongside the app. The application will be
available at `http://localhost:4000`.

### Docker Volumes

The Postgres data directory is stored in a Docker volume (`postgres_data`, mounted at
`/var/lib/postgresql/data`) which persists even if the container is removed. This ensures data
persistence across container restarts and updates.

## Releasing

Version tags drive the build workflow. Bump the version in `package.json`, then:

```bash
pnpm release:tag
```

This creates and pushes a `vX.Y.Z` tag when HEAD is a merge from a `release/*` branch (it is a
no-op otherwise). The tag triggers `.github/workflows/build-and-deploy.yml` to
run the test suite and publish the semver-tagged image to GHCR. Production deploys are currently
**manual** — the Pulumi job is intentionally broken since the infrastructure moved to the
`quinnjr.dev-infra` repository; see the comments in that workflow.

## Project Structure

- `src/app/` - Angular application (components, pages, services)
- `src/server/` - Express/GraphQL server code (resolvers, services, routes)
- `prisma/` - Database schema, migrations, and seed script
- `public/` - Static assets
- `dist/` - Build output
- `tests/` - Server-side test files
- `e2e/` - End-to-end tests
- `scripts/` - Utility scripts

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Pothos GraphQL](https://pothos-graphql.dev)
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Playwright Documentation](https://playwright.dev)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

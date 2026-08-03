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
| `WEBAUTHN_RP_ID`      | yes off `quinnjr.dev` | WebAuthn relying-party ID (default `quinnjr.dev`)                    |
| `WEBAUTHN_ORIGIN`     | yes off `quinnjr.dev` | Comma-separated origins accepted in a ceremony (default `https://$WEBAUTHN_RP_ID`) |
| `WEBAUTHN_RP_NAME`    | no                   | Display name shown by the authenticator (default `quinnjr.dev`)      |
| `SEED_ADMIN_EMAIL`    | seeding              | Email for the admin user created by `pnpm prisma:seed`               |
| `SEED_ADMIN_PASSWORD` | seeding              | Password for that admin user — no default; the seed exits if unset   |
| `PORT`                | no                   | SSR server port (default `4000`)                                     |
| `SITE_ORIGIN`         | no                   | Canonical origin emitted in sitemap/robots/llms (default the domain) |
| `SSR_ALLOWED_HOSTS`   | no                   | Comma-separated hostnames accepted by the SSR host guard             |
| `GITHUB_TOKEN`        | no                   | GitHub API token for `/api/github/*`; unset means the anonymous 60 req/hr limit |

There is no external identity provider. Sign-in starts with the GraphQL `login` mutation, and a
returned session token is stored in `localStorage` under `auth_token`. For an account with a passkey
enrolled — the intended state for the admin — `login` returns **no** token and sign-in continues
through a second factor; see [Passkeys / second factor](#passkeys--second-factor).

> **Changing `WEBAUTHN_RP_ID` invalidates every enrolled credential, with no migration path.** A
> credential created under one relying-party ID cannot be asserted under another, so every existing
> passkey becomes unusable and has to be re-enrolled. `WEBAUTHN_ORIGIN` is compared verbatim against
> the browser's origin, carrying the scheme and any non-default port — a wrong value silently breaks
> every ceremony. Both default to the production domain, so any deployment **not** served from
> `quinnjr.dev` (local SSR, Docker Compose, staging) must set them or no passkey will ever work.

### Passkeys / second factor

Passkeys (WebAuthn) are the second factor for password sign-in. Sign-in is a two-step ceremony:

1. `login(email:, password:)` returns an `AuthPayload`. If the account has no passkey, `token` and
   `user` are populated and `mfaRequired` is `false` — that is the whole sign-in. If the account has
   at least one passkey, `token` and `user` are `null`, `mfaRequired` is `true`, and `mfaToken`
   carries a short-lived ticket proving the password was correct. The ticket is **not** a session:
   it authorizes nothing but the second step.
2. `beginPasskeyAuthentication(mfaToken:)` returns the assertion options, the browser runs the
   ceremony, and `verifyPasskey(mfaToken:, response:)` returns the real `AuthPayload` with a session
   `token`.

The `mfaToken` is valid for **5 minutes** and is burned after a handful of failed assertions; a
pending challenge expires on the same 5-minute window. Once either lapses, start again from `login`.

Enrolment (`beginPasskeyRegistration` → `registerPasskey`) requires an existing session and is
driven from `/admin/security`. Passkeys are listed by the `passkeys` query, which only ever returns
the caller's own. Removing the **last** passkey reverts the account to single-factor password
sign-in, so `deletePasskey` refuses it unless the caller explicitly confirms disabling the second
factor — otherwise a stolen session token could quietly downgrade the account.

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

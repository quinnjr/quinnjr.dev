# QuinnjrTech

A modern web application built with Angular 20, featuring server-side rendering (SSR), authentication, and a robust content management system.

## Tech Stack

- **Framework**: Angular 20.3.6 with SSR
- **Runtime**: Node.js 20.19.0+
- **Package Manager**: pnpm 10.13.1+
- **Database**: SQLite with Prisma ORM
- **Authentication**: Auth0
- **Styling**: Tailwind CSS with Flowbite components
- **Testing**: Jest, Vitest, and Playwright
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 20.19.0 or higher
- pnpm 10.13.1 or higher
- Docker and Docker Compose (for containerized deployment)

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate
```

### Development Server

Run `pnpm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Environment Setup

Ensure you have the necessary environment variables configured for:
- Auth0 authentication
- Database connection (DATABASE_URL)

## Development

### Code Scaffolding

Run `pnpm ng generate component component-name` to generate a new component. You can also use `pnpm ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

```bash
# Development build
pnpm build

# Production build
pnpm build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

### Running SSR Locally

After building, you can run the SSR server:

```bash
pnpm serve:ssr:quinnjr.dev
```

## Testing

### Unit Tests

```bash
# Run Angular unit tests (Jest)
pnpm test

# Run with coverage
pnpm test:coverage

# Run server-side unit tests (Vitest)
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

## Database

### Prisma Commands

```bash
# Generate Prisma client
pnpm prisma:generate

# Create and apply migrations
pnpm prisma:migrate

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Seed the database
pnpm prisma:seed

# Reset database (WARNING: deletes all data)
pnpm prisma:reset
```

### Database Migrations

#### Development (Local SQLite)

```bash
DATABASE_URL="file:./data/quinnjr.db" pnpm prisma:migrate
DATABASE_URL="file:./data/quinnjr.db" pnpm prisma:seed
```

#### Production (Docker)

```bash
docker-compose exec app pnpm prisma:migrate deploy
docker-compose exec app pnpm prisma:seed
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

The application will be available at `http://localhost:4000`.

### Docker Volumes

The SQLite database is stored in a Docker volume (`sqlite_data`) which persists even if the container is removed. This ensures data persistence across container restarts and updates.

## Project Structure

- `src/` - Application source code
- `prisma/` - Database schema and migrations
- `public/` - Static assets
- `dist/` - Build output
- `tests/` - Test files
- `e2e/` - End-to-end tests
- `tf/` - Terraform configuration (if applicable)
- `scripts/` - Utility scripts

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Auth0 Angular SDK](https://github.com/auth0/auth0-angular)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Playwright Documentation](https://playwright.dev)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

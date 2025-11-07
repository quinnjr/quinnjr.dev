# QuinnjrTech

This project is built with [Angular CLI](https://github.com/angular/angular-cli) version 20.3.6 and features server-side rendering (SSR).

## Prerequisites

- Node.js 20.19.0 or higher
- pnpm 10.13.1 or higher

## Development server

Run `pnpm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `pnpm ng generate component component-name` to generate a new component. You can also use `pnpm ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `pnpm build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `pnpm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

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

The SQLite database is stored in a Docker volume (`sqlite_data`) which persists even if the container is removed.

### Database Migrations

Run Prisma migrations:

```bash
# Development (local SQLite)
DATABASE_URL="file:./data/quinnjr.db" pnpm prisma:migrate

# Seed the database
DATABASE_URL="file:./data/quinnjr.db" pnpm prisma:seed

# Production (Docker)
docker-compose exec app pnpm prisma:migrate deploy
docker-compose exec app pnpm prisma:seed
```

## Further help

To get more help on the Angular CLI use `pnpm ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

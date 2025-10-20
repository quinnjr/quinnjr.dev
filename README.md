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

### Build and run with Docker

```bash
# Build the Docker image
docker build -t quinnjr.tech:latest .

# Run the container
docker run -d -p 4000:4000 --name quinnjr-tech quinnjr.tech:latest
```

### Using Docker Compose

```bash
# Build and start the container
docker-compose up -d

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:4000`.

## Further help

To get more help on the Angular CLI use `pnpm ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

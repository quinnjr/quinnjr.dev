# Build stage
FROM node:24-alpine AS builder
# Angular 22 CLI requires Node >= 24.15 (or 22.22.3, which Docker Hub's
# 22-alpine does not yet ship); 24-alpine satisfies it.

# Set working directory
WORKDIR /app

# Copy only the dependency manifests first so the install layer is cached
# independently of application source changes.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Install dependencies (skip prepare script to avoid husky issues)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy remaining source code
COPY . .

# Build the application. Prisma Client generation is not a separate step here:
# package.json's `prebuild` script runs `prisma generate`, so an explicit
# `RUN pnpm prisma:generate` before this generated the identical client twice,
# in two layers.
RUN pnpm build

# Production stage
FROM node:24-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files and prisma schema
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Install only production dependencies, then generate the Prisma client.
# `prisma generate` creates its own output directory (src/generated/prisma), so
# no application source needs to be present here — copying src would only bust
# this layer's cache on every source edit.
# Skip prepare script (husky is dev-only)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    pnpm prisma:generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=4000

# Start the server
CMD ["node", "dist/quinnjr.dev/server/server.mjs"]


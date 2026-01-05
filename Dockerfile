# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and necessary source files first
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY src ./src

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Install dependencies (skip prepare script to avoid husky issues)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy remaining source code
COPY . .

# Generate Prisma Client for SQLite
RUN pnpm prisma:generate

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy package files and prisma schema
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY src ./src

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Install only production dependencies
# Skip prepare script (husky is dev-only)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    pnpm prisma:generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Keep src/generated/prisma directory (needed at runtime)
# Remove the rest of src directory (no longer needed after Prisma generation)
RUN find ./src -mindepth 1 -maxdepth 1 ! -name 'generated' -exec rm -rf {} +

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=4000

# Create directory for SQLite database with proper permissions
RUN mkdir -p /data && chmod 777 /data

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/ || exit 1

# Start the server with migrations
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/quinnjr.dev/server/server.mjs"]


# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma:generate

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files and prisma schema
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=4000

# Create directory for SQLite database
RUN mkdir -p /data

# Start the server
CMD ["node", "dist/quinnjr.dev/server/server.mjs"]


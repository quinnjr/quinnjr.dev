#!/bin/bash
# Deployment script for QuinnJR.dev
# Run this after pushing code changes

set -e

echo "🚀 Deploying QuinnJR.dev..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backup database before deployment
echo "💾 Backing up database..."
./deploy/backup-sqlite.sh

# Build and restart containers
echo "🐳 Building and restarting containers..."
docker-compose down
docker-compose up -d --build

# Wait for application to be healthy
echo "⏳ Waiting for application to be healthy..."
sleep 10

# Check health
if curl -f http://localhost:4000/api/resume/public > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running at http://localhost:4000"
else
    echo "❌ Deployment failed - application not responding"
    echo "📋 Check logs with: docker-compose logs -f"
    exit 1
fi

# Clean up old Docker images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✨ Deployment complete!"

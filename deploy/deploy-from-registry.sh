#!/bin/bash
# Deploy pre-built Docker image from GitHub Container Registry

set -e

echo "🚀 Deploying QuinnJR.dev from pre-built image..."

# Configuration
REGISTRY="ghcr.io"
IMAGE_NAME="quinnjr/quinnjr.dev"
TAG="${1:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

# Check if we're on the server
if [ ! -d "/opt/quinnjr.dev" ]; then
    echo "❌ Not on server. Run this script on your droplet."
    exit 1
fi

cd /opt/quinnjr.dev

# Backup database before deployment
echo "💾 Backing up database..."
if [ -f ./deploy/backup-sqlite.sh ]; then
    ./deploy/backup-sqlite.sh || echo "⚠️  Backup script not found, skipping..."
fi

# Pull latest image
echo "📥 Pulling latest image: ${FULL_IMAGE}"
docker pull ${FULL_IMAGE}

# Stop and remove old container
echo "🛑 Stopping old container..."
docker-compose -f docker-compose.prod.yml down || true

# Start new container
echo "🚀 Starting new container..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for application to be healthy
echo "⏳ Waiting for application to be healthy..."
sleep 10

# Check health
if curl -f http://localhost:4000/api/resume/public > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running"
else
    echo "❌ Deployment failed - application not responding"
    echo "📋 Check logs with: docker-compose -f docker-compose.prod.yml logs -f"
    exit 1
fi

# Clean up old Docker images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✨ Deployment complete!"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart:      docker-compose -f docker-compose.prod.yml restart"
echo "  Stop:         docker-compose -f docker-compose.prod.yml down"
echo "  Check status: docker-compose -f docker-compose.prod.yml ps"

#!/bin/bash
# SQLite Database Backup Script

set -e

# Configuration
BACKUP_DIR="/opt/quinnjr.dev/backups"
DB_FILE="/opt/quinnjr.dev/data/quinnjr.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/quinnjr_${TIMESTAMP}.db"
KEEP_DAYS=7  # Keep backups for 7 days

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "⚠️  Database file not found: $DB_FILE"
    exit 1
fi

# Create backup
echo "💾 Backing up database..."
cp "$DB_FILE" "$BACKUP_FILE"

# Compress backup
echo "🗜️  Compressing backup..."
gzip "$BACKUP_FILE"

# Calculate backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "✅ Backup created: ${BACKUP_FILE}.gz (${BACKUP_SIZE})"

# Delete old backups
echo "🧹 Cleaning up old backups (older than ${KEEP_DAYS} days)..."
find "$BACKUP_DIR" -name "quinnjr_*.db.gz" -type f -mtime +$KEEP_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "quinnjr_*.db.gz" -type f | wc -l)
echo "📊 Total backups: ${BACKUP_COUNT}"

# Optional: Upload to Digital Ocean Spaces or S3
# Uncomment and configure if you want offsite backups
# echo "☁️  Uploading to remote storage..."
# s3cmd put "${BACKUP_FILE}.gz" s3://your-bucket/backups/

echo "✨ Backup complete!"

#!/bin/bash
# Setup automated daily backups using cron

set -e

echo "⏰ Setting up automated backups..."

# Make backup script executable
chmod +x /opt/quinnjr.dev/deploy/backup-sqlite.sh

# Add cron job for daily backups at 2 AM
CRON_CMD="/opt/quinnjr.dev/deploy/backup-sqlite.sh >> /opt/quinnjr.dev/logs/backup.log 2>&1"
CRON_TIME="0 2 * * *"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-sqlite.sh"; then
    echo "⚠️  Backup cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_TIME $CRON_CMD") | crontab -
    echo "✅ Backup cron job added (runs daily at 2 AM)"
fi

# Create initial backup
echo "💾 Creating initial backup..."
/opt/quinnjr.dev/deploy/backup-sqlite.sh

echo "✨ Automated backups configured!"
echo "📋 Backups will be stored in: /opt/quinnjr.dev/backups"
echo "📊 View backup logs: tail -f /opt/quinnjr.dev/logs/backup.log"

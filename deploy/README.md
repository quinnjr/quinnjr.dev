# Deployment Scripts

## Scripts Overview

### digitalocean-setup.sh
Initial server setup for Digital Ocean droplet.

**Usage:**
```bash
# On fresh Ubuntu 22.04 droplet
curl -fsSL <your-script-url> | bash
```

**What it does:**
- Installs Docker & Docker Compose
- Sets up firewall (UFW)
- Installs Nginx
- Configures SSL with Certbot
- Creates application directory
- Sets up basic security

### deploy.sh
Deploy or update the application.

**Usage:**
```bash
cd /opt/quinnjr.dev
./deploy/deploy.sh
```

**What it does:**
- Pulls latest code
- Backs up database
- Rebuilds Docker containers
- Verifies deployment
- Cleans up old images

### backup-sqlite.sh
Manual database backup.

**Usage:**
```bash
./deploy/backup-sqlite.sh
```

**What it does:**
- Creates timestamped backup
- Compresses with gzip
- Stores in /opt/quinnjr.dev/backups/
- Cleans backups older than 7 days

### setup-backups.sh
Configure automated daily backups.

**Usage:**
```bash
./deploy/setup-backups.sh
```

**What it does:**
- Adds cron job for daily backups (2 AM)
- Creates initial backup
- Sets up backup logging

## Quick Start

```bash
# 1. Initial setup (on new droplet)
chmod +x deploy/*.sh
./deploy/digitalocean-setup.sh

# 2. Deploy application
./deploy/deploy.sh

# 3. Set up automated backups
./deploy/setup-backups.sh
```

## Maintenance Commands

```bash
# Update application
./deploy/deploy.sh

# Manual backup
./deploy/backup-sqlite.sh

# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Check status
docker-compose ps
```

## Troubleshooting

```bash
# Application won't start
docker-compose logs
docker-compose restart

# Database issues
./deploy/backup-sqlite.sh  # Backup first
docker-compose down
docker-compose up -d

# Check disk space
df -h
docker system prune -af

# Check resources
docker stats
free -h
top
```

## Documentation

See [DIGITALOCEAN-DEPLOYMENT.md](../docs/DIGITALOCEAN-DEPLOYMENT.md) for complete deployment guide.

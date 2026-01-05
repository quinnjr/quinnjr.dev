# Digital Ocean Deployment Guide

## Overview

This guide covers deploying QuinnJR.dev on Digital Ocean's cheapest hosting option ($6/month) using Docker and SQLite.

## 💰 Cost Breakdown

### Monthly Costs
- **Droplet**: $6/month (Basic - 1GB RAM, 1 CPU, 25GB SSD)
- **Bandwidth**: Included (1TB transfer)
- **Backups**: $0 (using free DIY cron scripts)
  - *Digital Ocean Backups available for $1.20/month if preferred*
- **Domain**: ~$12/year (if needed, ~$1/month)

**Total: $6/month** 🎉 **(Absolute minimum!)**

## 🏗️ Architecture

```
Internet
  ↓
Digital Ocean Droplet ($6/month)
  ├── Nginx (Reverse Proxy + SSL)
  │   └── Port 80/443
  ↓
Docker Container
  ├── Node.js/Express App
  ├── Port 4000
  └── SQLite Database
      └── /data/quinnjr.db (persisted volume)
```

## 📋 Prerequisites

1. **Digital Ocean Account**
   - Sign up at [digitalocean.com](https://www.digitalocean.com)
   - Add payment method

2. **Domain Name** (optional but recommended)
   - Point A record to droplet IP
   - Configure DNS

3. **SSH Key**
   - Generate if you don't have one:
     ```bash
     ssh-keygen -t ed25519 -C "your_email@example.com"
     ```

## 🚀 Deployment Steps

### Step 1: Create Digital Ocean Droplet

1. **Log into Digital Ocean**
2. Click "Create" → "Droplets"
3. **Choose Configuration**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic - $6/month
     - 1 GB RAM
     - 1 vCPU
     - 25 GB SSD
     - 1000 GB transfer
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH keys (add your public key)
   - **Hostname**: quinnjr-dev

4. Click "Create Droplet"
5. **Note the IP address**

### Step 2: Configure DNS (if using custom domain)

1. **In Digital Ocean**:
   - Go to Networking → Domains
   - Add domain: `quinnjr.dev`
   - Add A record:
     - Hostname: `@`
     - Will Direct to: Your droplet
   - Add A record:
     - Hostname: `www`
     - Will Direct to: Your droplet

2. **At your domain registrar**:
   - Point nameservers to Digital Ocean:
     - `ns1.digitalocean.com`
     - `ns2.digitalocean.com`
     - `ns3.digitalocean.com`

### Step 3: Initial Server Setup

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/quinnjr.dev/main/deploy/digitalocean-setup.sh | bash

# Or upload and run manually
scp deploy/digitalocean-setup.sh root@your_droplet_ip:/tmp/
ssh root@your_droplet_ip
chmod +x /tmp/digitalocean-setup.sh
/tmp/digitalocean-setup.sh
```

### Step 4: Deploy Application

```bash
# SSH into droplet
ssh root@your_droplet_ip

# Clone repository
cd /opt/quinnjr.dev
git clone https://github.com/yourusername/quinnjr.dev.git .

# Configure environment
nano .env
```

**Edit .env**:
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=file:/data/quinnjr.db
AUTH0_DOMAIN=dev-skrc3oude0nhleqs.us.auth0.com
AUTH0_AUDIENCE=https://quinnjr.dev
```

```bash
# Build and start application
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Verify it's running
curl http://localhost:4000/api/resume/public
```

### Step 5: Set Up SSL Certificate (Free)

```bash
# Install SSL certificate
sudo certbot --nginx -d quinnjr.dev -d www.quinnjr.dev

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Certificate will auto-renew
```

### Step 6: Set Up Automated Backups

```bash
cd /opt/quinnjr.dev
./deploy/setup-backups.sh
```

## 📦 Database Management

### SQLite Location
```
/opt/quinnjr.dev/data/quinnjr.db
```

### Manual Backup
```bash
./deploy/backup-sqlite.sh
```

### Restore from Backup
```bash
# Stop application
docker-compose down

# Restore database
cd /opt/quinnjr.dev
gunzip -c backups/quinnjr_20260104_120000.db.gz > data/quinnjr.db

# Start application
docker-compose up -d
```

### View Database
```bash
# Install sqlite3
sudo apt-get install -y sqlite3

# Connect to database
sqlite3 /opt/quinnjr.dev/data/quinnjr.db

# Run SQL commands
.tables
SELECT * FROM Resume;
.exit
```

## 🔄 Updating Application

### Method 1: Using Deploy Script
```bash
cd /opt/quinnjr.dev
./deploy/deploy.sh
```

### Method 2: Manual Deployment
```bash
# SSH into droplet
ssh root@your_droplet_ip

# Navigate to app directory
cd /opt/quinnjr.dev

# Pull latest code
git pull origin main

# Backup database (automatically done by deploy script)
./deploy/backup-sqlite.sh

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

## 📊 Monitoring

### Check Application Status
```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs -f

# Check resource usage
docker stats
```

### Check System Resources
```bash
# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

## 🔍 Troubleshooting

### Application Not Starting

```bash
# Check logs
docker-compose logs

# Check if port is in use
sudo netstat -tulpn | grep 4000

# Restart container
docker-compose restart

# Rebuild from scratch
docker-compose down
docker system prune -af
docker-compose up -d --build
```

### Database Issues

```bash
# Check database file
ls -lh /opt/quinnjr.dev/data/quinnjr.db

# Check permissions
chmod 666 /opt/quinnjr.dev/data/quinnjr.db

# Verify database integrity
sqlite3 /opt/quinnjr.dev/data/quinnjr.db "PRAGMA integrity_check;"
```

### SSL Certificate Issues

```bash
# Test SSL
sudo certbot renew --dry-run

# Manually renew
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker images
docker system prune -af

# Clean old backups
find /opt/quinnjr.dev/backups -mtime +7 -delete

# Clean logs
sudo truncate -s 0 /var/log/nginx/*.log
```

## 🎯 Performance Optimization

### For 1GB RAM Droplet

1. **Enable Swap** (helps prevent OOM):
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. **Optimize Nginx**:
```nginx
# /etc/nginx/nginx.conf
worker_processes 1;
worker_connections 512;
```

3. **Limit Docker Memory**:
```yaml
# docker-compose.yml
services:
  app:
    mem_limit: 768m
    memswap_limit: 1g
```

## 🔒 Security Best Practices

### 1. Set Up Firewall
```bash
sudo ufw status
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Disable Root SSH
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Set Up Fail2Ban
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Regular Updates
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

## 💾 Backup Strategy

### Automated Backups
- **Daily backups** at 2 AM (configured by setup-backups.sh)
- **7-day retention** on local disk
- Stored in `/opt/quinnjr.dev/backups`

### Offsite Backups (Recommended)

**Option 1: Digital Ocean Spaces** ($5/month for 250GB)
```bash
# Install s3cmd
sudo apt-get install -y s3cmd

# Configure
s3cmd --configure

# Add to backup script
s3cmd put /opt/quinnjr.dev/backups/*.gz s3://your-bucket/
```

**Option 2: Dropbox/Google Drive** (Free)
```bash
# Use rclone
curl https://rclone.org/install.sh | sudo bash
rclone config
# Add to backup script
```

## 📈 Scaling Options

### When to Upgrade

Upgrade droplet if you experience:
- High CPU usage (>80% sustained)
- Out of memory errors
- Slow response times
- Disk space issues

### Upgrade Path

1. **$12/month**: 2GB RAM, 1 CPU, 50GB SSD
2. **$18/month**: 2GB RAM, 2 CPUs, 60GB SSD
3. **$24/month**: 4GB RAM, 2 CPUs, 80GB SSD

### Migration to Larger Droplet

```bash
# 1. Create backup
./deploy/backup-sqlite.sh

# 2. Create new droplet (larger size)
# 3. Run setup on new droplet
# 4. Copy data directory
scp -r old_droplet:/opt/quinnjr.dev/data new_droplet:/opt/quinnjr.dev/

# 5. Update DNS to point to new droplet
# 6. Decommission old droplet
```

## 🆘 Emergency Procedures

### Application Down

```bash
# Quick restart
docker-compose restart

# If that doesn't work
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Database Corruption

```bash
# Stop application
docker-compose down

# Restore from latest backup
cd /opt/quinnjr.dev
gunzip -c backups/$(ls -t backups/ | head -1) > data/quinnjr.db

# Start application
docker-compose up -d
```

### Droplet Completely Down

1. **Access via Digital Ocean Console**
2. **Reboot droplet** from control panel
3. **SSH in** and check logs
4. **Restore from backup** if needed

## 📋 Maintenance Checklist

### Daily
- ✅ Check application is running
- ✅ Verify automated backups

### Weekly
- ✅ Review error logs
- ✅ Check disk space
- ✅ Monitor resource usage

### Monthly
- ✅ Update system packages
- ✅ Review and clean old backups
- ✅ Check SSL certificate status
- ✅ Review security logs

## 📞 Support Resources

- **Digital Ocean Docs**: https://docs.digitalocean.com
- **Docker Docs**: https://docs.docker.com
- **SQLite Docs**: https://www.sqlite.org/docs.html
- **Community**: Digital Ocean Community forums

## 📊 Cost Optimization Tips

1. **Use Reserved IP** (free with droplet)
2. **Use DIY backups** (free via cron) - we do this by default!
   - Digital Ocean Backups ($1.20/month) only if you want automatic snapshots
3. **Use local backups** + manual offsite copies (free with Dropbox/GDrive)
4. **Monitor bandwidth** (1TB/month included - more than enough)
5. **Clean Docker images** regularly (prevents disk space costs)
6. **No CDN needed** at this scale (saves $5+/month)
7. **SQLite vs PostgreSQL** (saves $15+/month)

**Our configuration is already optimized for minimum cost! ($6/month)**

## 🎉 Deployment Checklist

- [ ] Created Digital Ocean droplet ($6/month)
- [ ] Configured DNS (if using custom domain)
- [ ] Ran setup script
- [ ] Cloned repository
- [ ] Configured .env file
- [ ] Built and started Docker container
- [ ] Set up SSL certificate (free)
- [ ] Configured automated backups
- [ ] Tested application
- [ ] Set up monitoring
- [ ] Documented access credentials

---

**Deployment Cost**: $6/month (MINIMUM POSSIBLE ON DIGITAL OCEAN)
**Setup Time**: ~30 minutes
**Maintenance**: ~15 minutes/week

**You're now running a production-ready application for the cost of a coffee! ☕**

**Cost Comparison:**
- Our setup: $6/month
- With managed PostgreSQL: $21+/month
- With DO Backups: $7.20/month
- App Platform: $12+/month
- Heroku: $7+/month (less resources)
- Vercel Pro: $20+/month

**This is the absolute cheapest reliable production setup!** 🎉

# Digital Ocean CLI (doctl) Setup Guide

## Overview

`doctl` is Digital Ocean's command-line interface that allows you to manage your infrastructure programmatically. Our deployment script uses it to automatically create and configure droplets.

## Installation

### Automatic Installation

The deployment script will automatically install `doctl` if it's not found. Just run:

```bash
./deploy/auto-deploy.sh
```

### Manual Installation

#### Linux
```bash
cd /tmp
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin
```

#### macOS (with Homebrew)
```bash
brew install doctl
```

#### Windows (with Chocolatey)
```bash
choco install doctl
```

#### From Source
```bash
go install github.com/digitalocean/doctl/cmd/doctl@latest
```

## Authentication

### Step 1: Create API Token

1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Click **"Generate New Token"**
3. Configure:
   - **Name**: `quinnjr-deployment`
   - **Expiration**: No expiry (or custom)
   - **Scopes**: Read & Write
4. Click **"Generate Token"**
5. **Copy the token** (you can only see it once!)

### Step 2: Authenticate doctl

```bash
doctl auth init
```

When prompted, paste your API token.

### Step 3: Verify Authentication

```bash
doctl account get
```

You should see your Digital Ocean account details!

## Common Commands

### List Droplets
```bash
doctl compute droplet list
```

### Create Droplet
```bash
doctl compute droplet create quinnjr-dev \
  --region nyc3 \
  --size s-1vcpu-1gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys YOUR_SSH_KEY_ID \
  --wait
```

### Get Droplet Info
```bash
doctl compute droplet get DROPLET_ID
```

### Delete Droplet
```bash
doctl compute droplet delete DROPLET_ID
```

### List SSH Keys
```bash
doctl compute ssh-key list
```

### Upload SSH Key
```bash
doctl compute ssh-key create my-key \
  --public-key "$(cat ~/.ssh/id_ed25519.pub)"
```

### List Regions
```bash
doctl compute region list
```

### List Sizes (Plans)
```bash
doctl compute size list
```

### Check Balance
```bash
doctl account get
```

## Droplet Sizes

### Basic Plans (Cheapest)
```
Slug              RAM    CPUs   Disk    Price/Month
s-1vcpu-1gb       1GB    1      25GB    $6.00        ← We use this
s-1vcpu-2gb       2GB    1      50GB    $12.00
s-2vcpu-2gb       2GB    2      60GB    $18.00
s-2vcpu-4gb       4GB    2      80GB    $24.00
```

### Premium Plans
```
Slug              RAM    CPUs   Disk    Price/Month
s-1vcpu-1gb-amd   1GB    1      25GB    $7.00
s-1vcpu-1gb-intel 1GB    1      25GB    $7.00
```

## Regions

### Nearest Regions (by location)

**North America:**
- `nyc1`, `nyc3` - New York
- `sfo2`, `sfo3` - San Francisco
- `tor1` - Toronto

**Europe:**
- `lon1` - London
- `fra1` - Frankfurt
- `ams3` - Amsterdam

**Asia:**
- `sgp1` - Singapore
- `blr1` - Bangalore

**Australia:**
- `syd1` - Sydney

## Using doctl with Our Script

### Fully Automated Deployment

```bash
./deploy/auto-deploy.sh
```

The script will:
1. ✅ Install `doctl` if needed
2. ✅ Help you authenticate
3. ✅ Upload your SSH key
4. ✅ Create the droplet
5. ✅ Wait for it to be ready
6. ✅ Deploy your application

### Using Existing Droplet

```bash
./deploy/auto-deploy.sh
```

When asked "Create NEW droplet?", answer `n` and select your existing droplet.

## Managing Your Infrastructure

### Check Droplet Status
```bash
# List all droplets
doctl compute droplet list

# Get specific droplet
doctl compute droplet get DROPLET_ID

# Get droplet actions history
doctl compute droplet-action list DROPLET_ID
```

### Resize Droplet (Upgrade)
```bash
# Power off first
doctl compute droplet-action power-off DROPLET_ID --wait

# Resize
doctl compute droplet-action resize DROPLET_ID \
  --size s-2vcpu-2gb \
  --wait

# Power on
doctl compute droplet-action power-on DROPLET_ID --wait
```

### Create Snapshot (Backup)
```bash
doctl compute droplet-action snapshot DROPLET_ID \
  --snapshot-name "quinnjr-backup-$(date +%Y%m%d)" \
  --wait
```

### List Snapshots
```bash
doctl compute snapshot list
```

### Restore from Snapshot
```bash
doctl compute droplet create quinnjr-dev-restored \
  --region nyc3 \
  --size s-1vcpu-1gb \
  --image SNAPSHOT_ID \
  --ssh-keys YOUR_SSH_KEY_ID \
  --wait
```

### Delete Droplet
```bash
# Get droplet ID
doctl compute droplet list

# Delete
doctl compute droplet delete DROPLET_ID

# Delete with confirmation
doctl compute droplet delete DROPLET_ID --force
```

## Cost Management

### Check Current Spending
```bash
doctl account get
```

### List All Resources
```bash
# Droplets
doctl compute droplet list

# Volumes
doctl compute volume list

# Load Balancers
doctl compute load-balancer list

# Databases
doctl databases list

# Spaces (Object Storage)
# (requires separate s3cmd or similar)
```

### Clean Up Resources
```bash
# Delete unused droplets
doctl compute droplet delete DROPLET_ID

# Delete unused volumes
doctl compute volume delete VOLUME_ID

# Delete unused snapshots
doctl compute snapshot delete SNAPSHOT_ID
```

## Monitoring

### Get Droplet Metrics
```bash
# Not directly available in doctl
# Use Digital Ocean dashboard or API
```

### Check Droplet Logs
```bash
# SSH into droplet
ssh root@DROPLET_IP

# View logs
docker-compose logs -f
```

## Firewall Management

### Create Firewall
```bash
doctl compute firewall create \
  --name quinnjr-firewall \
  --inbound-rules "protocol:tcp,ports:22,sources:addresses:0.0.0.0/0,sources:addresses:::/0 protocol:tcp,ports:80,sources:addresses:0.0.0.0/0,sources:addresses:::/0 protocol:tcp,ports:443,sources:addresses:0.0.0.0/0,sources:addresses:::/0" \
  --outbound-rules "protocol:tcp,ports:all,destinations:addresses:0.0.0.0/0,destinations:addresses:::/0 protocol:udp,ports:all,destinations:addresses:0.0.0.0/0,destinations:addresses:::/0" \
  --droplet-ids DROPLET_ID
```

### List Firewalls
```bash
doctl compute firewall list
```

## Advanced Usage

### Tag Droplets
```bash
# Create tag
doctl compute tag create production

# Add tag to droplet
doctl compute tag add production --resource-type droplet --resource-id DROPLET_ID

# List droplets by tag
doctl compute droplet list --tag-name production
```

### Floating IP
```bash
# Create floating IP
doctl compute floating-ip create --region nyc3

# Assign to droplet
doctl compute floating-ip-action assign FLOATING_IP --droplet-id DROPLET_ID
```

### Load Balancer
```bash
doctl compute load-balancer create \
  --name quinnjr-lb \
  --region nyc3 \
  --forwarding-rules "entry_protocol:https,entry_port:443,target_protocol:http,target_port:80,tls_passthrough:false" \
  --droplet-ids DROPLET_ID
```

## Troubleshooting

### Authentication Issues
```bash
# Re-authenticate
doctl auth init

# List auth contexts
doctl auth list

# Switch context
doctl auth switch CONTEXT_NAME
```

### API Rate Limiting
```bash
# Check rate limit status
doctl compute quota get
```

If you hit rate limits, wait a few minutes and try again.

### Command Not Found
```bash
# Check installation
which doctl

# Check version
doctl version

# Update doctl
# Linux:
cd /tmp
curl -sL https://github.com/digitalocean/doctl/releases/latest/download/doctl-latest-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# macOS:
brew upgrade doctl
```

### Permission Denied
```bash
# Make sure token has write permissions
# Go to: https://cloud.digitalocean.com/account/api/tokens
# Delete old token and create new one with Read & Write
```

## Security Best Practices

### 1. Token Management
- ✅ Use separate tokens for different projects
- ✅ Set expiration dates when possible
- ✅ Revoke unused tokens
- ✅ Never commit tokens to git

### 2. SSH Key Management
```bash
# List keys
doctl compute ssh-key list

# Delete old keys
doctl compute ssh-key delete SSH_KEY_ID
```

### 3. Droplet Security
- ✅ Always use SSH keys (not passwords)
- ✅ Keep software updated
- ✅ Use firewalls
- ✅ Enable automatic security updates

## Cost Optimization with doctl

### 1. Delete Unused Resources
```bash
# Find old droplets
doctl compute droplet list --format ID,Name,CreatedAt

# Delete them
doctl compute droplet delete OLD_DROPLET_ID
```

### 2. Use Snapshots Instead of Running Droplets
```bash
# Create snapshot
doctl compute droplet-action snapshot DROPLET_ID \
  --snapshot-name "backup-before-shutdown"

# Delete droplet (keeps snapshot)
doctl compute droplet delete DROPLET_ID

# Restore when needed
doctl compute droplet create quinnjr-dev \
  --image SNAPSHOT_ID \
  --region nyc3 \
  --size s-1vcpu-1gb
```

### 3. Schedule Droplet Uptime
Use cron or scripts to:
- Power off droplets during non-business hours
- Power on when needed
- Save ~50% on costs for non-24/7 services

## Integration with Deployment Script

Our `auto-deploy.sh` uses doctl to:

1. **Authenticate**: Verify or request API token
2. **SSH Keys**: Upload your SSH key automatically
3. **Create Droplet**: Provision the cheapest plan ($6/month)
4. **Wait**: Monitor until droplet is ready
5. **Deploy**: Automatically configure and deploy your app

All with a single command:
```bash
./deploy/auto-deploy.sh
```

## Resources

- **Official Docs**: https://docs.digitalocean.com/reference/doctl/
- **GitHub**: https://github.com/digitalocean/doctl
- **API Reference**: https://docs.digitalocean.com/reference/api/
- **Community**: https://www.digitalocean.com/community/tags/doctl

## Quick Reference

```bash
# Setup
doctl auth init                              # Authenticate
doctl account get                            # Verify auth

# Droplets
doctl compute droplet list                   # List droplets
doctl compute droplet create NAME OPTIONS    # Create droplet
doctl compute droplet delete ID              # Delete droplet
doctl compute droplet get ID                 # Get droplet info

# SSH Keys
doctl compute ssh-key list                   # List keys
doctl compute ssh-key create NAME --public-key "KEY"  # Add key

# Regions & Sizes
doctl compute region list                    # Available regions
doctl compute size list                      # Available plans

# Images
doctl compute image list --public            # Public images
doctl compute snapshot list                  # Your snapshots

# Monitoring
doctl compute droplet-action list ID         # Action history
doctl account get                            # Account info
```

---

**doctl makes Digital Ocean automation easy!** 🚀

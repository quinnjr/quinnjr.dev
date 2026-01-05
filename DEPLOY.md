# Deployment Guide 🚀

Deploy your site to Digital Ocean - Choose your method!

## Two Deployment Options

### 1️⃣ **doctl** - Quick & Automated (Recommended for beginners)
One command deployment with Digital Ocean CLI.

### 2️⃣ **Terraform** - Professional & Maintainable (Recommended for production)
Infrastructure as Code with version control and state management.

**Both cost $6/month!** Choose based on your needs. See [Comparison Guide](docs/TERRAFORM-vs-DOCTL.md).

---

## Option 1: doctl (One-Command Deployment)

## Quick Start

```bash
cd /home/joseph/quinnjr.dev
./deploy/auto-deploy.sh
```

That's it! The script will:
1. ✅ Install `doctl` (Digital Ocean CLI) if needed
2. ✅ Authenticate with Digital Ocean
3. ✅ Check/create SSH key
4. ✅ **CREATE YOUR DROPLET AUTOMATICALLY** ($6/month)
5. ✅ Wait for droplet to be ready
6. ✅ Configure domain and SSL (optional)
7. ✅ Install Docker, Nginx, and all dependencies
8. ✅ Deploy your application
9. ✅ Set up automatic backups
10. ✅ Configure firewall and security

**Total time: ~5-10 minutes** (fully automated!)

---

## Before You Start

### 1. Get a Digital Ocean API Token

The script uses `doctl` (Digital Ocean CLI) to create your droplet automatically.

1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Click **"Generate New Token"**
3. Name: `quinnjr-deployment`
4. Scopes: **Read & Write**
5. Click **"Generate Token"**
6. **Copy the token** (you'll paste it when the script asks)

### 2. (Optional) Prepare Your Domain

If using a custom domain:
1. Add domain in Digital Ocean → Networking → Domains
2. Create A record: `@` → Your droplet IP
3. Create A record: `www` → Your droplet IP
4. Update nameservers at your registrar:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`

---

## Running the Deployment

### Step 1: Start the Script

```bash
cd /home/joseph/quinnjr.dev
./deploy/auto-deploy.sh
```

### Step 2: Answer the Prompts

The script will ask you:

1. **Digital Ocean API Token**: Paste your token (from prerequisites)
2. **Create new droplet?**: Press Y to create automatically
3. **Region**: Choose closest to you (e.g., nyc3, sfo3, lon1)
4. **Domain name**: Enter your domain or press N for IP-only
5. **Auth0 settings**: Press Y to use defaults (recommended)
6. **GitHub repository**: Enter your repo URL (optional)

### Step 3: Confirm and Deploy

The script shows a summary. Press `Y` to start deployment.

### Step 4: Wait

The script will:
- Connect to your server
- Install everything
- Deploy your app
- Configure Nginx and SSL

**Grab a coffee! ☕** This takes about 5-10 minutes.

---

## What Gets Installed

### With doctl:
- ✅ **Droplet creation** (s-1vcpu-1gb - $6/month)
- ✅ **SSH key upload**
- ✅ **Automatic IP retrieval**

### On Your Server:
- ✅ Docker & Docker Compose
- ✅ Git
- ✅ Nginx (web server)
- ✅ Certbot (SSL certificates)
- ✅ UFW Firewall
- ✅ Your application (in Docker)
- ✅ Automated backups (cron job)
- ✅ 2GB swap file (helps with memory)

### Configuration:
- ✅ Application at `/opt/quinnjr.dev`
- ✅ Database at `/opt/quinnjr.dev/data/quinnjr.db`
- ✅ Backups at `/opt/quinnjr.dev/backups`
- ✅ Logs at `/opt/quinnjr.dev/logs`

---

## After Deployment

### Test Your Site

**With domain:**
```bash
curl https://yourdomain.com/api/resume/public
```

**With IP:**
```bash
curl http://YOUR_IP/api/resume/public
```

You should see JSON data!

### Update Auth0

1. Go to Auth0 Dashboard → Applications
2. Add your domain to:
   - Allowed Callback URLs: `https://yourdomain.com/callback`
   - Allowed Logout URLs: `https://yourdomain.com`
   - Allowed Web Origins: `https://yourdomain.com`
3. Save changes

### Test Admin Login

Visit: `https://yourdomain.com/admin`

You should be redirected to Auth0 login!

---

## Useful Commands

### SSH into Your Server
```bash
ssh root@YOUR_DROPLET_IP
```

### View Application Logs
```bash
cd /opt/quinnjr.dev
docker-compose logs -f
```

### Restart Application
```bash
cd /opt/quinnjr.dev
docker-compose restart
```

### Deploy Updates
```bash
cd /opt/quinnjr.dev
./deploy/deploy.sh
```

### Manual Backup
```bash
cd /opt/quinnjr.dev
./deploy/backup-sqlite.sh
```

### Check Status
```bash
cd /opt/quinnjr.dev
docker-compose ps
docker stats
df -h
free -h
```

---

## Troubleshooting

### SSH Connection Failed

**Check:**
1. Droplet is running (check Digital Ocean dashboard)
2. IP address is correct
3. SSH key was added to droplet

**Manual connection:**
```bash
ssh root@YOUR_DROPLET_IP
```

### Application Won't Start

**Check logs:**
```bash
ssh root@YOUR_DROPLET_IP
cd /opt/quinnjr.dev
docker-compose logs
```

**Restart:**
```bash
docker-compose restart
```

### SSL Certificate Failed

**If DNS isn't ready yet:**
```bash
ssh root@YOUR_DROPLET_IP
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Can't Access Website

**Check Nginx:**
```bash
ssh root@YOUR_DROPLET_IP
systemctl status nginx
nginx -t
```

**Check Firewall:**
```bash
ufw status
```

---

## Re-running the Script

Safe to run multiple times! The script:
- ✅ Checks what's already installed
- ✅ Skips completed steps
- ✅ Won't break existing setup
- ✅ Can be used to update configuration

---

## Manual Deployment (If Script Fails)

If the automated script has issues, see:
- `DEPLOY-NOW.md` - Step-by-step manual instructions
- `docs/DIGITALOCEAN-DEPLOYMENT.md` - Complete detailed guide

---

## Cost Reminder

**Monthly Cost: $6**
- Droplet: $6/month
- SSL: FREE (Let's Encrypt)
- Backups: FREE (DIY cron)
- Bandwidth: Included (1TB)

No hidden fees! 🎉

---

## What's Next?

### Optional Improvements

1. **Set Up Monitoring**
   - Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
   - Monitor your site URL
   - Get email alerts if down

2. **Configure Offsite Backups**
   - Use Dropbox, Google Drive, or Digital Ocean Spaces
   - See `docs/DIGITALOCEAN-DEPLOYMENT.md` for details

3. **Add More Resources** (if needed)
   - Upgrade to $12/month droplet (2GB RAM)
   - See `docs/DIGITALOCEAN-DEPLOYMENT.md#scaling-options`

---

## Support

### Quick Help

**View the summary:**
```bash
./deploy/auto-deploy.sh --help
```

**Test connection:**
```bash
ssh root@YOUR_DROPLET_IP "docker-compose -f /opt/quinnjr.dev/docker-compose.yml ps"
```

### Documentation

- **Quick Start**: This file
- **Step-by-Step**: `DEPLOY-NOW.md`
- **Complete Guide**: `docs/DIGITALOCEAN-DEPLOYMENT.md`
- **Auth0 Setup**: `docs/AUTH0-SETUP.md`

---

## Script Features

### Intelligent Deployment
- ✅ Detects existing installations
- ✅ Handles both new and existing servers
- ✅ Works with or without domain
- ✅ Automatic SSL when DNS is ready
- ✅ Tests everything before finishing

### Safe & Secure
- ✅ Stops on errors
- ✅ Validates inputs
- ✅ Configures firewall
- ✅ Creates backups
- ✅ Shows clear status messages

### Flexible
- ✅ Works with any Git repository
- ✅ Supports IP-only deployment
- ✅ Custom Auth0 settings
- ✅ Can be re-run safely

---

## Success Checklist

After running the script, verify:

- [ ] Application responds: `curl http://YOUR_IP/api/resume/public`
- [ ] Website loads in browser
- [ ] Admin redirects to Auth0 login
- [ ] Docker container is running: `docker-compose ps`
- [ ] Nginx is running: `systemctl status nginx`
- [ ] Firewall is active: `ufw status`
- [ ] Backups are scheduled: `crontab -l`
- [ ] SSL certificate installed (if using domain)

All checked? **You're live!** 🎉

---

## One-Liner Summary

```bash
# From your local machine:
./deploy/auto-deploy.sh

# Answer a few questions
# Wait 5-10 minutes
# Your site is LIVE!
```

**It really is that simple!** ☕✨

---

## Option 2: Terraform (Infrastructure as Code)

For a more professional setup with version control and state management:

### Quick Start

```bash
# 1. Install Terraform
brew install terraform  # macOS
# or see https://www.terraform.io/downloads

# 2. Configure
cd terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Add your DO token and settings

# 3. Deploy
terraform init
terraform plan    # Preview changes
terraform apply   # Deploy!

# 4. Get outputs
terraform output  # Shows IP, SSH command, etc.
```

### What You Get

- ✅ **State Management** - Terraform tracks what's deployed
- ✅ **Change Preview** - See what will change before applying
- ✅ **Version Control** - Infrastructure as code in git
- ✅ **Reproducible** - Recreate infrastructure identically
- ✅ **Team Friendly** - Share and collaborate easily

### Complete Guide

See detailed Terraform documentation:
- **Setup & Usage**: `terraform/README.md`
- **Configuration**: `terraform/terraform.tfvars.example`
- **Comparison**: `docs/TERRAFORM-vs-DOCTL.md`

---

## Which Should You Choose?

### Use doctl if:
- ✅ Want to deploy NOW (5 minutes)
- ✅ Solo developer
- ✅ Learning/experimenting
- ✅ Simple one-time deployment

### Use Terraform if:
- ✅ Professional production setup
- ✅ Want version control
- ✅ Working in a team
- ✅ Need change tracking
- ✅ Portfolio/resume project
- ✅ Plan to scale

**Can't decide?** Read the [detailed comparison](docs/TERRAFORM-vs-DOCTL.md).

**Our recommendation:** Use Terraform - it's industry standard and shows best practices! But doctl is perfectly fine for quick deployments.

---

**Need help?** Check the docs or review the script output for troubleshooting tips.

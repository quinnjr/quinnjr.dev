# Quick Start Guide

Deploy quinnjr.dev to DigitalOcean in 5 minutes!

## Prerequisites

- DigitalOcean account
- GitHub account with Actions enabled
- Terraform installed

## Step-by-Step

### 1. Get Your API Tokens

**DigitalOcean API Token:**
```
1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Name: "Terraform quinnjr.dev"
4. Scopes: Read & Write
5. Copy the token (starts with "dop_v1_")
```

**GitHub Personal Access Token:**
```
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "DigitalOcean App Deploy"
4. Scopes: ✓ read:packages
5. Click "Generate token"
6. Copy the token (starts with "ghp_")
```

### 2. Make Your Docker Image Accessible

Your image needs to be public OR your token needs access:

```bash
# Make the package public (easiest)
1. Go to: https://github.com/quinnjr/quinnjr.dev/pkgs/container/quinnjr.dev
2. Click "Package settings"
3. Scroll to "Danger Zone"
4. Click "Change visibility" → Public
```

### 3. Configure Terraform

```bash
cd tf

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit with your tokens
nano terraform.tfvars
```

Replace these values:
```hcl
do_token     = "dop_v1_YOUR_DIGITALOCEAN_TOKEN"
github_token = "ghp_YOUR_GITHUB_TOKEN"
github_username = "quinnjr"  # Your GitHub username
```

### 4. Deploy!

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (takes 2-5 minutes)
terraform apply
```

Type `yes` when prompted.

### 5. Get Your App URL

```bash
terraform output app_url
```

Visit the URL! 🎉

## What You Just Created

- **App Platform Container**: $5/month
  - 512MB RAM, 1 vCPU
  - Auto-deploys from GitHub
  - Managed infrastructure
  - Persistent volume for SQLite database (1GB included)

- **Total**: ~$5/month

**Note**: By using SQLite instead of PostgreSQL, you save $15/month!

## Next Steps

### Run Database Migrations

```bash
# Set database URL for SQLite
export DATABASE_URL="file:/data/quinnjr.db"

# Run Prisma migrations (use DigitalOcean console or include in Docker build)
# Or run migrations locally before deploying:
DATABASE_URL="file:./data/quinnjr.db" pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

### Auto-Deploy Setup

Your app is already configured to auto-deploy! Just:

```bash
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build Docker image
3. Push to ghcr.io
4. DigitalOcean pulls and deploys automatically ✨

### View Logs

```bash
# In DigitalOcean dashboard
https://cloud.digitalocean.com/apps

# Or with doctl CLI
doctl apps logs <app-id> --follow
```

### Add Custom Domain

1. Edit `terraform.tfvars`:
```hcl
domain_name = "quinnjr.dev"
enable_dns  = true
```

2. Apply changes:
```bash
terraform apply
```

3. Update nameservers at your registrar:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

4. Wait for DNS propagation (1-48 hours)

5. Verify:
```bash
dig quinnjr.dev
curl https://quinnjr.dev
```

📖 **Detailed DNS guide**: See [DNS_SETUP.md](./DNS_SETUP.md)

## Troubleshooting

### "Image not found" error
- Make sure your package is public
- Or verify your GitHub token has `read:packages` scope
- Test: `docker pull ghcr.io/quinnjr/quinnjr.dev:latest`

### Database connection fails
```bash
# Test connection
psql $(terraform output -raw database_url)
```

### App won't start
```bash
# Check logs in DigitalOcean dashboard
https://cloud.digitalocean.com/apps
```

## Destroy Everything

⚠️ **This deletes everything permanently!**

```bash
terraform destroy
```

## Cost Optimization Tips

1. **Use the free trial**: DigitalOcean offers $200 credit for 60 days
2. **Scale down database**: If you have low traffic, the smallest database is sufficient
3. **Monitor usage**: Set up billing alerts in DigitalOcean dashboard
4. **Destroy when not needed**: Use `terraform destroy` for test environments

## Support

- [Full README](./README.md)
- [DigitalOcean Docs](https://docs.digitalocean.com/)
- [Terraform Docs](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)


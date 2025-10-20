# Quick Start Guide

Deploy quinnjr.tech to DigitalOcean in 5 minutes!

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
3. Name: "Terraform quinnjr.tech"
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
1. Go to: https://github.com/quinnjr/quinnjr.tech/pkgs/container/quinnjr.tech
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

- **PostgreSQL Database**: $15/month
  - 1 vCPU, 1GB RAM, 10GB SSD
  - Automatic backups
  - SSL enabled

- **App Platform Container**: $5/month
  - 512MB RAM, 1 vCPU
  - Auto-deploys from GitHub
  - Managed infrastructure

- **Total**: ~$20/month

## Next Steps

### Run Database Migrations

```bash
# Export database URL
export DATABASE_URL=$(terraform output -raw database_url)

# Run Prisma migrations
pnpm prisma migrate deploy

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
domain_name = "quinnjr.tech"
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
dig quinnjr.tech
curl https://quinnjr.tech
```

📖 **Detailed DNS guide**: See [DNS_SETUP.md](./DNS_SETUP.md)

## Troubleshooting

### "Image not found" error
- Make sure your package is public
- Or verify your GitHub token has `read:packages` scope
- Test: `docker pull ghcr.io/quinnjr/quinnjr.tech:latest`

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


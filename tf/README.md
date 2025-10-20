# Terraform Infrastructure for quinnjr.tech

This Terraform module deploys the quinnjr.tech application on DigitalOcean with the following resources:

## Resources Created

### 1. **PostgreSQL Database Cluster**
- **Size**: `db-s-1vcpu-1gb` (smallest available)
  - 1 vCPU
  - 1GB RAM
  - 10GB SSD disk
  - ~$15/month
- **Version**: PostgreSQL 16
- **High Availability**: Single node (for cost optimization)

### 2. **App Platform Application**
- **Size**: `basic-xxs` (smallest available)
  - 512MB RAM
  - 1 vCPU
  - ~$5/month
- **Auto-scaling**: Disabled (single instance)
- **Auto-deploy**: Enabled (deploys when new images are pushed to ghcr.io)

### 3. **Database Firewall**
- Configured to allow App Platform to access PostgreSQL

### 4. **Environment Variables**
Automatically injected into the Docker container:
- `DATABASE_URL` - Complete Prisma-compatible connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Individual connection parameters
- `PORT` - Application port (4000)
- `NODE_ENV` - Node environment (production)
- `DB_SSL` - SSL mode enabled

## Prerequisites

1. **DigitalOcean Account**
   - Create an account at https://digitalocean.com
   - Generate an API token: https://cloud.digitalocean.com/account/api/tokens
   - Needs read/write permissions

2. **GitHub Personal Access Token (PAT)**
   - Create a PAT: https://github.com/settings/tokens
   - Required scope: `read:packages`
   - Allows DigitalOcean to pull from GitHub Container Registry

3. **Terraform**
   ```bash
   # Install Terraform
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip
   unzip terraform_1.7.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

4. **Docker Image**
   - Ensure your GitHub Actions workflow has run and pushed the image to ghcr.io
   - Image should be at: `ghcr.io/quinnjr/quinnjr.tech:latest`
   - Make sure the image is public or your GitHub token has access

## Setup Instructions

### 1. Configure Variables

Copy the example variables file:
```bash
cd tf
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your credentials:
```hcl
do_token     = "dop_v1_your_digitalocean_token"
github_token = "ghp_your_github_pat"
github_username = "quinnjr"
```

**⚠️ IMPORTANT**: Never commit `terraform.tfvars` to git! It's already in `.gitignore`.

### 2. Initialize Terraform

```bash
cd tf
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

Review the resources that will be created.

### 4. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm.

This will:
- Create the PostgreSQL database cluster (~2-5 minutes)
- Create the App Platform application
- Configure database firewall
- Deploy your Docker container
- Set up all environment variables

### 5. Get Outputs

```bash
# View all outputs
terraform output

# View specific output
terraform output app_url
terraform output database_url

# View sensitive outputs
terraform output -json database_password
```

## Accessing Your Application

After deployment, your application will be available at:
```bash
terraform output app_url
```

Example: `https://quinnjr-tech-xxxxx.ondigitalocean.app`

## Database Connection

The `DATABASE_URL` is automatically injected into your container as an environment variable in the format Prisma expects:

```
postgresql://user:password@host:port/database?sslmode=require
```

Your Prisma schema should use:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Running Migrations

You can run Prisma migrations against the deployed database:

```bash
# Get the database URL
export DATABASE_URL=$(terraform output -raw database_url)

# Run migrations
pnpm prisma migrate deploy

# Or generate Prisma client
pnpm prisma generate
```

## Updating the Application

The App Platform is configured to auto-deploy when new images are pushed to GitHub Container Registry. Simply:

```bash
# Push to main branch
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build Docker image
3. Push to ghcr.io
4. DigitalOcean will automatically pull and deploy the new image

## Cost Estimation

Monthly costs:
- PostgreSQL (db-s-1vcpu-1gb): ~$15/month
- App Platform (basic-xxs): ~$5/month
- **Total**: ~$20/month

## Scaling

To scale your application:

### Vertical Scaling (More Resources)

Edit `tf/main.tf`:
```hcl
# For App Platform
instance_size_slug = "basic-xs" # 1GB RAM, $10/month

# For Database
size = "db-s-2vcpu-2gb" # 2 vCPU, 2GB RAM, ~$30/month
```

### Horizontal Scaling (More Instances)

Edit `tf/main.tf`:
```hcl
service {
  instance_count = 3 # Run 3 instances
  # ...
}
```

Then run:
```bash
terraform apply
```

## Destroying Infrastructure

To tear down all resources:

```bash
terraform destroy
```

⚠️ **WARNING**: This will permanently delete:
- The database and all data
- The application
- All configurations

## Troubleshooting

### Application won't start
```bash
# Check App Platform logs
doctl apps logs <app-id> --follow

# Or use the DigitalOcean dashboard
# https://cloud.digitalocean.com/apps
```

### Database connection issues
```bash
# Verify database is running
terraform output database_host

# Test connection
psql $(terraform output -raw database_url)
```

### Image pull errors
- Verify your GitHub token has `read:packages` permission
- Make sure the image exists: `docker pull ghcr.io/quinnjr/quinnjr.tech:latest`
- Check if the image is public or token has access

## Custom Domain

Terraform is now configured to automatically manage your custom domain and DNS records!

### Quick Setup

1. Edit `terraform.tfvars`:
```hcl
domain_name = "quinnjr.tech"  # Your domain
enable_dns  = true            # Enable DNS management
```

2. Apply changes:
```bash
terraform apply
```

3. Update nameservers at your domain registrar to:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

Terraform will automatically create:
- ✅ A record for apex domain (quinnjr.tech)
- ✅ CNAME record for www subdomain
- ✅ SSL certificate (via Let's Encrypt)
- ✅ Domain verification records

### Detailed DNS Setup

See [DNS_SETUP.md](./DNS_SETUP.md) for:
- Using DigitalOcean DNS
- Using external DNS providers (Cloudflare, Route53)
- Manual DNS configuration
- Troubleshooting
- SSL certificate setup

## Backup

DigitalOcean automatically backs up your database. To create a manual backup:

```bash
# Using doctl CLI
doctl databases backup <database-id>
```

## Monitoring

View metrics in the DigitalOcean dashboard:
- App Platform: https://cloud.digitalocean.com/apps
- Database: https://cloud.digitalocean.com/databases

## Support

- DigitalOcean Documentation: https://docs.digitalocean.com/
- Terraform DigitalOcean Provider: https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs


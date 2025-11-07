# Terraform Infrastructure for quinnjr.dev

This Terraform module deploys the quinnjr.dev application on DigitalOcean with the following resources:

## Resources Created

### 1. **App Platform Application**
- **Size**: `basic-xxs` (smallest available)
  - 512MB RAM
  - 1 vCPU
  - ~$5/month
- **Auto-scaling**: Disabled (single instance)
- **Auto-deploy**: Enabled (deploys when new images are pushed to ghcr.io)

### 2. **Persistent Volume**
- **SQLite Database Storage**: 1GB persistent volume
  - Mounted at `/data` in the container
  - Persists even if the container is removed or recreated
  - Database file: `/data/quinnjr.db`

### 3. **Environment Variables**
Automatically injected into the Docker container:
- `DATABASE_URL` - SQLite database file path (`file:/data/quinnjr.db`)
- `PORT` - Application port (4000)
- `NODE_ENV` - Node environment (production)

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

3. **Docker Image**
   - Ensure your GitHub Actions workflow has run and pushed the image to ghcr.io
   - Image should be at: `ghcr.io/quinnjr/quinnjr.dev:latest`
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
- Create the App Platform application
- Create a persistent volume for SQLite database
- Deploy your Docker container
- Set up all environment variables

### 5. Get Outputs

```bash
# View all outputs
terraform output

# View specific output
terraform output app_url
terraform output database_path
```

## Accessing Your Application

After deployment, your application will be available at:
```bash
terraform output app_url
```

Example: `https://quinnjr-dev-xxxxx.ondigitalocean.app`

## Database Connection

The `DATABASE_URL` is automatically injected into your container as an environment variable pointing to the SQLite database:

```
file:/data/quinnjr.db
```

Your Prisma schema should use:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

The SQLite database is stored in a persistent volume mounted at `/data`, ensuring data persists even if the container is removed or recreated.

## Running Migrations

You can run Prisma migrations against the deployed database:

```bash
# Connect to the running container
doctl apps logs <app-id> --follow

# Or use the DigitalOcean dashboard to run commands
# Navigate to: https://cloud.digitalocean.com/apps
# Select your app → Settings → Run Console Command
# Run: pnpm prisma migrate deploy
```

Alternatively, you can run migrations locally before deploying, or include them in your Docker image build process.

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
- App Platform (basic-xxs): ~$5/month
- Persistent Volume (1GB): Included in App Platform
- **Total**: ~$5/month

**Note**: By switching from PostgreSQL to SQLite, you save ~$15/month on database hosting costs!

## Scaling

To scale your application:

### Vertical Scaling (More Resources)

Edit `tf/main.tf`:
```hcl
# For App Platform
instance_size_slug = "basic-xs" # 1GB RAM, $10/month

# For SQLite volume (if you need more storage)
volume {
  name         = "sqlite-data"
  mount_path   = "/data"
  size_gigabytes = 5  # Increase to 5GB if needed
}
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
- The application
- The persistent volume and all SQLite database data
- All configurations

**Important**: Make sure to backup your SQLite database before destroying the infrastructure!

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
# Verify database path
terraform output database_path

# Check if database file exists in the container
# Use DigitalOcean dashboard console or doctl to access the container
```

### Image pull errors
- Verify your GitHub token has `read:packages` permission
- Make sure the image exists: `docker pull ghcr.io/quinnjr/quinnjr.dev:latest`
- Check if the image is public or token has access

## Custom Domain

Terraform is now configured to automatically manage your custom domain and DNS records!

### Quick Setup

1. Edit `terraform.tfvars`:
```hcl
domain_name = "quinnjr.dev"  # Your domain
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
- ✅ A record for apex domain (quinnjr.dev)
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

Since SQLite is a file-based database, you can backup the database file directly:

```bash
# Using doctl CLI to access the container
doctl apps logs <app-id> --follow

# Or use the DigitalOcean dashboard console to copy the database file
# The database is located at: /data/quinnjr.db

# For automated backups, consider:
# 1. Setting up a cron job in the container to periodically copy the database file
# 2. Using DigitalOcean Spaces to store backups
# 3. Implementing a backup script that runs on container startup
```

## Monitoring

View metrics in the DigitalOcean dashboard:
- App Platform: https://cloud.digitalocean.com/apps
- Database: https://cloud.digitalocean.com/databases

## Support

- DigitalOcean Documentation: https://docs.digitalocean.com/
- Terraform DigitalOcean Provider: https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs


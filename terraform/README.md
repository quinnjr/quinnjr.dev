# Terraform Infrastructure as Code

Deploy your Digital Ocean infrastructure with Terraform for better maintainability and version control.

## Why Terraform?

### ✅ Benefits Over Manual/doctl Deployment

- **Infrastructure as Code**: Version control your infrastructure
- **State Management**: Track what's deployed
- **Declarative**: Describe what you want, not how to get there
- **Reproducible**: Recreate infrastructure identically
- **Plan/Apply**: Preview changes before applying
- **Team-Friendly**: Share infrastructure configuration
- **Industry Standard**: Professional best practice

### 💰 Cost: Still $6/month!

Terraform doesn't add any cost - it's just a better way to manage the same resources.

## Quick Start

### 1. Install Terraform

```bash
# macOS (Homebrew)
brew install terraform

# Linux (Ubuntu/Debian)
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Verify installation
terraform version
```

### 2. Configure Variables

```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required variables:**
```hcl
do_token = "your_digitalocean_api_token"  # Get from https://cloud.digitalocean.com/account/api/tokens
domain_name = "quinnjr.dev"               # Or leave empty for IP-only
```

### 3. Initialize Terraform

```bash
terraform init
```

This downloads the Digital Ocean provider.

### 4. Preview Changes

```bash
terraform plan
```

Shows what will be created (no changes made yet).

### 5. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` to confirm. This creates:
- ✅ Droplet ($6/month)
- ✅ SSH key
- ✅ Firewall rules
- ✅ Domain & DNS (if configured)
- ✅ Project organization

### 6. Get Outputs

```bash
terraform output
```

Shows:
- Droplet IP address
- SSH command
- Website URL
- Nameservers (if using domain)

### 7. SSH into Server

```bash
# Use the output from above
ssh root@$(terraform output -raw droplet_ip)
```

### 8. Deploy Application

Once on the server:
```bash
cd /opt/quinnjr.dev
git clone https://github.com/yourusername/quinnjr-dev.git .

# Create .env file
nano .env
# (Add your Auth0 credentials)

# Deploy
docker-compose up -d --build
```

## Configuration Options

### Droplet Size

```hcl
droplet_size = "s-1vcpu-1gb"   # $6/month  (default)
droplet_size = "s-1vcpu-2gb"   # $12/month
droplet_size = "s-2vcpu-2gb"   # $18/month
droplet_size = "s-2vcpu-4gb"   # $24/month
```

### Region

```hcl
region = "nyc3"  # New York (default)
region = "sfo3"  # San Francisco
region = "lon1"  # London
region = "fra1"  # Frankfurt
region = "sgp1"  # Singapore
```

### Domain

```hcl
# With domain
domain_name = "quinnjr.dev"

# Without domain (IP only)
domain_name = ""
```

### Backups

```hcl
# Use our free DIY backups (recommended)
enable_backups = false  # default

# Use Digital Ocean automated backups (+$1.20/month)
enable_backups = true
```

### Environment

```hcl
environment = "Production"   # default
environment = "Staging"
environment = "Development"
```

## Common Commands

### View Current State

```bash
terraform show
```

### List Resources

```bash
terraform state list
```

### Get Output Values

```bash
# All outputs
terraform output

# Specific output
terraform output droplet_ip
terraform output ssh_command
```

### Update Infrastructure

```bash
# Edit terraform.tfvars or variables
nano terraform.tfvars

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### Destroy Infrastructure

```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy everything
terraform destroy
```

⚠️ **Warning**: This deletes your droplet and all data!

## Advanced Usage

### Multiple Environments

Create separate workspaces:

```bash
# Create staging environment
terraform workspace new staging
terraform apply

# Create production environment
terraform workspace new production
terraform apply

# Switch between environments
terraform workspace select staging
terraform workspace select production

# List workspaces
terraform workspace list
```

### Import Existing Resources

If you already have a droplet:

```bash
# Get droplet ID from Digital Ocean
doctl compute droplet list

# Import it
terraform import digitalocean_droplet.web DROPLET_ID
```

### Remote State (Team Collaboration)

Store state in Digital Ocean Spaces (S3-compatible):

```hcl
# Add to main.tf
terraform {
  backend "s3" {
    endpoint                    = "nyc3.digitaloceanspaces.com"
    region                      = "us-east-1"  # Dummy, but required
    bucket                      = "your-terraform-state"
    key                         = "quinnjr-dev/terraform.tfstate"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
  }
}
```

### Modules (Reusable Components)

For multiple sites:

```hcl
module "site1" {
  source = "./modules/web-droplet"

  droplet_name = "site1"
  domain_name  = "site1.com"
}

module "site2" {
  source = "./modules/web-droplet"

  droplet_name = "site2"
  domain_name  = "site2.com"
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform
        env:
          TF_VAR_do_token: ${{ secrets.DO_TOKEN }}

      - name: Terraform Plan
        run: terraform plan
        working-directory: ./terraform
        env:
          TF_VAR_do_token: ${{ secrets.DO_TOKEN }}

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve
        working-directory: ./terraform
        env:
          TF_VAR_do_token: ${{ secrets.DO_TOKEN }}
```

## Files Overview

```
terraform/
├── main.tf                    # Main infrastructure definition
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output definitions
├── terraform.tfvars.example   # Example configuration
├── terraform.tfvars           # Your configuration (gitignored)
├── cloud-init.yml            # Initial server setup
├── .gitignore                # Ignore state and secrets
└── README.md                 # This file
```

## Cost Breakdown

### Using Terraform (Same Cost!)

```
Monthly Costs:
- Droplet (s-1vcpu-1gb):  $6.00
- Terraform:              $0.00 (free tool)
- State storage:          $0.00 (local by default)

Total: $6/month
```

### Optional Add-ons

```
- DO Backups:             +$1.20/month (we use free DIY backups)
- DO Spaces (state):      +$5/month (optional, for teams)
- Monitoring:             $0.00 (included)
- Firewall:               $0.00 (included)
```

## Troubleshooting

### Authentication Error

```bash
# Verify token is set
echo $TF_VAR_do_token

# Or set it
export TF_VAR_do_token="your_token"

# Or use terraform.tfvars (recommended)
```

### State Lock Error

```bash
# If state is locked (rare)
terraform force-unlock LOCK_ID
```

### Plan Shows Unexpected Changes

```bash
# Refresh state
terraform refresh

# See what changed
terraform plan
```

### Destroy Hangs

```bash
# Force destroy
terraform destroy -auto-approve
```

### SSH Key Already Exists

Either:
1. Import existing key: `terraform import digitalocean_ssh_key.default SSH_KEY_ID`
2. Or rename in variables: `ssh_key_name = "quinnjr-deployment-2"`

## Best Practices

### 1. Version Control

```bash
# Add terraform directory to git
git add terraform/
git commit -m "Add Terraform configuration"

# But exclude secrets
# (already in .gitignore)
```

### 2. Use Variables

Don't hardcode values - use variables for:
- API tokens
- Domain names
- Droplet sizes
- Regions

### 3. Review Plans

Always run `terraform plan` before `apply`:
```bash
terraform plan  # Review
terraform apply # Only if plan looks good
```

### 4. Regular Backups

Even with Terraform, backup your state:
```bash
cp terraform.tfstate terraform.tfstate.backup
```

### 5. Document Changes

Use git commits to track infrastructure changes:
```bash
git commit -m "Scale droplet from 1GB to 2GB RAM"
```

## Migration from doctl

Already deployed with doctl? Import your resources:

```bash
# Get your droplet ID
doctl compute droplet list

# Import droplet
terraform import digitalocean_droplet.web DROPLET_ID

# Import SSH key
terraform import digitalocean_ssh_key.default SSH_KEY_ID

# Import firewall
terraform import digitalocean_firewall.web FIREWALL_ID

# Verify
terraform plan
# Should show no changes if import worked correctly
```

## Terraform vs doctl

| Feature | doctl | Terraform |
|---------|-------|-----------|
| Ease of use | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐⭐ Learning curve |
| Version control | ⭐⭐ Scripted | ⭐⭐⭐⭐⭐ Native IaC |
| State management | ⭐ Manual | ⭐⭐⭐⭐⭐ Built-in |
| Team collaboration | ⭐⭐ Scripts | ⭐⭐⭐⭐⭐ Excellent |
| Change preview | ⭐ None | ⭐⭐⭐⭐⭐ Plan/Apply |
| Multi-provider | ⭐ DO only | ⭐⭐⭐⭐⭐ Any cloud |
| Industry adoption | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Standard |
| Cost | $6/month | $6/month |

## When to Use What?

### Use doctl if:
- ✅ Quick one-off deployment
- ✅ Solo developer
- ✅ Learning/experimenting
- ✅ Simple setup

### Use Terraform if:
- ✅ Production infrastructure
- ✅ Team collaboration
- ✅ Multiple environments
- ✅ Want version control
- ✅ Industry best practices
- ✅ Future scaling

## Resources

- **Terraform Docs**: https://www.terraform.io/docs
- **DO Provider**: https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs
- **Tutorials**: https://learn.hashicorp.com/terraform
- **Our Deployment**: `../DEPLOY.md`

---

**Professional infrastructure management for just $6/month!** 🚀

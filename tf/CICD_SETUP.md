# CI/CD Setup Guide for Terraform

This guide explains how to set up automatic Terraform deployments through GitHub Actions.

## Overview

The GitHub Actions workflow automatically:
1. ✅ Runs tests on code push
2. ✅ Builds Docker image
3. ✅ Applies Terraform configuration
4. ✅ Deploys to DigitalOcean

## Prerequisites

Before enabling automatic Terraform deployments, you need:

1. ✅ DigitalOcean account with API token
2. ✅ GitHub Personal Access Token (PAT)
3. ✅ Remote state backend configured (recommended)
4. ✅ GitHub repository secrets configured

---

## Step 1: Configure Remote State Backend (Recommended)

Using local state in CI/CD is problematic. Choose one of these options:

### Option A: DigitalOcean Spaces (Recommended - $5/month)

#### 1.1 Create a Space

```bash
# Via doctl CLI
doctl spaces create quinnjr-tech-terraform-state --region nyc3

# Or in the dashboard
https://cloud.digitalocean.com/spaces
```

#### 1.2 Generate Spaces Access Keys

```bash
# Via dashboard
https://cloud.digitalocean.com/account/api/spaces

# Create new key pair, save:
# - Access Key (like AWS_ACCESS_KEY_ID)
# - Secret Key (like AWS_SECRET_ACCESS_KEY)
```

#### 1.3 Configure Backend

Edit `tf/backend.tf` and uncomment the S3 backend configuration:

```hcl
terraform {
  backend "s3" {
    bucket   = "quinnjr-tech-terraform-state"
    key      = "production/terraform.tfstate"
    region   = "us-east-1"
    endpoint = "https://nyc3.digitaloceanspaces.com"

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    force_path_style            = true
  }
}
```

#### 1.4 Initialize Backend Locally

```bash
cd tf

# Set credentials
export AWS_ACCESS_KEY_ID="your-spaces-access-key"
export AWS_SECRET_ACCESS_KEY="your-spaces-secret-key"

# Migrate state
terraform init -migrate-state
```

### Option B: Terraform Cloud (Free tier available)

#### 1.1 Create Terraform Cloud Account

https://app.terraform.io/signup/account

#### 1.2 Create Organization and Workspace

```
Organization: your-organization
Workspace: quinnjr-tech-production
```

#### 1.3 Configure Backend

Edit `tf/backend.tf`:

```hcl
terraform {
  cloud {
    organization = "your-organization"

    workspaces {
      name = "quinnjr-tech-production"
    }
  }
}
```

#### 1.4 Get API Token

```bash
# Login locally
terraform login

# Or get token from: https://app.terraform.io/app/settings/tokens
```

---

## Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository:

### 2.1 Navigate to Secrets

```
https://github.com/quinnjr/quinnjr.tech/settings/secrets/actions
```

### 2.2 Required Secrets

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `DIGITALOCEAN_TOKEN` | DigitalOcean API token | https://cloud.digitalocean.com/account/api/tokens |
| `GH_PAT` | GitHub Personal Access Token | https://github.com/settings/tokens (needs `read:packages`) |
| `SPACES_ACCESS_KEY` | Spaces access key (if using Spaces) | https://cloud.digitalocean.com/account/api/spaces |
| `SPACES_SECRET_KEY` | Spaces secret key (if using Spaces) | https://cloud.digitalocean.com/account/api/spaces |

### 2.3 Optional Secrets

| Secret Name | Description | Default |
|-------------|-------------|---------|
| `DOMAIN_NAME` | Your custom domain | "" (empty) |
| `ENABLE_DNS` | Enable DNS management | false |

### Example: Adding Secrets via GitHub CLI

```bash
# DigitalOcean token
gh secret set DIGITALOCEAN_TOKEN

# GitHub PAT
gh secret set GH_PAT

# Spaces credentials (if using)
gh secret set SPACES_ACCESS_KEY
gh secret set SPACES_SECRET_KEY

# Optional domain
gh secret set DOMAIN_NAME --body "quinnjr.tech"
gh secret set ENABLE_DNS --body "true"
```

---

## Step 3: Update Workflow to Use Remote State

If using **DigitalOcean Spaces**, add to the workflow:

Edit `.github/workflows/build-and-deploy.yml`, in the `terraform` job, add before `Terraform Init`:

```yaml
- name: Configure Spaces Backend
  run: |
    export AWS_ACCESS_KEY_ID="${{ secrets.SPACES_ACCESS_KEY }}"
    export AWS_SECRET_ACCESS_KEY="${{ secrets.SPACES_SECRET_KEY }}"
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.SPACES_ACCESS_KEY }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.SPACES_SECRET_KEY }}
```

If using **Terraform Cloud**, add:

```yaml
- name: Setup Terraform
  uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: 1.7.0
    cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}
```

---

## Step 4: Test the Workflow

### 4.1 Initial Manual Deployment

First time? Deploy manually to verify everything works:

```bash
cd tf

# Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars

# Deploy manually
terraform init
terraform plan
terraform apply
```

### 4.2 Commit Backend Configuration

```bash
git add tf/backend.tf
git commit -m "Configure Terraform remote state backend"
git push origin develop
```

### 4.3 Trigger Automatic Deployment

```bash
# Push to develop (plan only)
git checkout develop
git commit -m "Test automatic deployment"
git push origin develop

# GitHub Actions will:
# - Run tests
# - Build Docker image (tag: develop)
# - Run terraform plan (no apply)

# Push to main (full deployment)
git checkout main
git merge develop
git push origin main

# GitHub Actions will:
# - Run tests
# - Build Docker image (tag: latest)
# - Run terraform plan
# - Run terraform apply (automatically deploys!)
```

---

## Workflow Behavior

### On `develop` Branch

```
Push to develop
  ↓
Run Tests ✓
  ↓
Build Docker Image → ghcr.io/quinnjr/quinnjr.tech:develop
  ↓
Terraform Plan (view changes)
  ↓
🛑 STOP (no apply)
```

### On `main`/`master` Branch

```
Push to main
  ↓
Run Tests ✓
  ↓
Build Docker Image → ghcr.io/quinnjr/quinnjr.tech:latest
  ↓
Terraform Plan
  ↓
Terraform Apply (automatic deployment!)
  ↓
✅ Live at: https://quinnjr.tech
```

### On Pull Request

```
PR to main/develop
  ↓
Run Tests ✓
  ↓
🛑 STOP (no Docker build, no Terraform)
  ↓
Comment PR with test results
```

---

## Security Considerations

### ✅ DO:
- ✅ Use GitHub Secrets for sensitive data
- ✅ Enable branch protection on `main`
- ✅ Require pull request reviews
- ✅ Use remote state backend
- ✅ Enable state locking (Terraform Cloud/Spaces)
- ✅ Rotate tokens regularly

### ❌ DON'T:
- ❌ Commit `terraform.tfvars` to git
- ❌ Store secrets in code
- ❌ Use local state for CI/CD
- ❌ Allow direct pushes to `main`
- ❌ Share API tokens

---

## Branch Protection Setup

Recommended GitHub branch protection rules for `main`:

```
Settings → Branches → Add rule → main

✓ Require pull request reviews before merging
✓ Require status checks to pass before merging
  - test
  - build-and-push
✓ Require conversation resolution before merging
✓ Require linear history
✓ Include administrators
```

---

## Monitoring Deployments

### View Workflow Runs

```
https://github.com/quinnjr/quinnjr.tech/actions
```

### View Terraform Output

In the workflow run, expand the "Output Application URL" step:

```yaml
::notice::Application deployed at: https://quinnjr-tech-xxxxx.ondigitalocean.app
```

### Check Infrastructure

```bash
# View current state
terraform show

# List resources
terraform state list

# Get outputs
terraform output
```

---

## Troubleshooting

### Workflow Fails at Terraform Init

**Error**: "Backend initialization failed"

**Solution**: Verify backend configuration and credentials

```bash
# For Spaces
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# For Terraform Cloud
terraform login
```

### Workflow Fails at Terraform Apply

**Error**: "DigitalOcean API error"

**Solution**: Verify `DIGITALOCEAN_TOKEN` secret is correct

```bash
# Test token
curl -X GET \
  -H "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
  "https://api.digitalocean.com/v2/account"
```

### State Lock Errors

**Error**: "State is locked"

**Solution**:
```bash
# If using Spaces/Terraform Cloud, it should auto-lock
# To force unlock (use carefully!)
terraform force-unlock <LOCK_ID>
```

### Secrets Not Available

**Error**: "Required secret not found"

**Solution**: Verify secrets are set at repository level (not organization)

```bash
# List secrets (requires GitHub CLI)
gh secret list

# Set missing secrets
gh secret set DIGITALOCEAN_TOKEN
```

---

## Rolling Back

If deployment fails or you need to rollback:

### Option 1: Revert Commit

```bash
git revert HEAD
git push origin main
# GitHub Actions will deploy previous state
```

### Option 2: Manual Rollback

```bash
cd tf

# View state history (if using versioned backend)
terraform state list

# Rollback to specific version
terraform apply -var="docker_image=ghcr.io/quinnjr/quinnjr.tech:previous-sha"
```

### Option 3: Destroy and Recreate

```bash
# CAUTION: This deletes everything!
terraform destroy
terraform apply
```

---

## Advanced Configuration

### Deploy Different Branches to Different Environments

Create separate workflows for each environment:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [develop]

jobs:
  terraform:
    steps:
      - run: |
          cat > terraform.tfvars <<EOF
          project_name = "quinnjr-tech-staging"
          docker_image = "ghcr.io/${{ github.repository }}:develop"
          domain_name  = "staging.quinnjr.tech"
          EOF
```

### Manual Approval for Production

Add manual approval step:

```yaml
- name: Wait for Approval
  if: github.ref == 'refs/heads/main'
  uses: trstringer/manual-approval@v1
  with:
    secret: ${{ secrets.GITHUB_TOKEN }}
    approvers: quinnjr
    minimum-approvals: 1
```

### Notify on Deployment

Add notification step:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to production completed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

---

## Cost Tracking

Monitor costs:
- DigitalOcean: https://cloud.digitalocean.com/billing
- Terraform Cloud: Free tier (up to 500 resources)
- GitHub Actions: 2000 minutes/month free

---

## Next Steps

1. ✅ Configure remote state backend
2. ✅ Add GitHub secrets
3. ✅ Update workflow if using Spaces/TF Cloud
4. ✅ Test manual deployment
5. ✅ Enable branch protection
6. ✅ Test automatic deployment
7. ✅ Set up monitoring/alerts

---

## Support

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Terraform DigitalOcean Provider](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
- [DigitalOcean API Docs](https://docs.digitalocean.com/reference/api/)
- [Terraform Backend Configuration](https://www.terraform.io/docs/language/settings/backends/index.html)


# Domain Setup for quinnjr.dev

This document describes how the domain `quinnjr.dev` is configured for this project.

## Current Configuration

The application is configured to use **quinnjr.dev** as the primary domain.

### Terraform Configuration

In your local `tf/terraform.tfvars` file (not committed to git), ensure you have:

```hcl
domain_name = "quinnjr.dev"
enable_dns  = true
```

## DNS Setup Steps

### Option 1: Using DigitalOcean DNS (Recommended - Already Configured)

Since `enable_dns = true` is set in the Terraform configuration, DigitalOcean will automatically:
1. Create a DNS zone for `quinnjr.dev`
2. Configure the domain to point to your App Platform application

**Steps Required:**
1. Ensure your domain registrar (where you purchased quinnjr.dev) is configured to use DigitalOcean's nameservers:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`

2. Run Terraform to apply the configuration:
   ```bash
   cd tf
   terraform plan -var="github_api_token=$GITHUB_API_TOKEN"
   terraform apply -var="github_api_token=$GITHUB_API_TOKEN"
   ```

3. After Terraform applies, the domain should automatically be configured in DigitalOcean App Platform

### Option 2: Manual DNS Configuration

If you prefer to manage DNS outside of DigitalOcean:

1. Set `enable_dns = false` in `tf/terraform.tfvars`
2. Get the App Platform URL from Terraform output:
   ```bash
   cd tf
   terraform output app_url
   ```
3. Create a CNAME record at your DNS provider:
   - **Type**: CNAME
   - **Name**: @ (or leave blank for root domain) / www
   - **Value**: The app URL from Terraform output (without https://)
   - **TTL**: 3600 (or your preference)

## Verifying Domain Configuration

After DNS propagation (can take up to 48 hours, usually much faster):

1. Check DNS resolution:
   ```bash
   nslookup quinnjr.dev
   dig quinnjr.dev
   ```

2. Test HTTPS access:
   ```bash
   curl -I https://quinnjr.dev
   ```

3. Visit in browser: https://quinnjr.dev

## Current Status

✅ **Domain configured in Terraform**: quinnjr.dev  
✅ **DNS management enabled**: DigitalOcean DNS  
✅ **SSL/TLS**: Automatically managed by DigitalOcean App Platform  

## Troubleshooting

### Domain not resolving
- Check nameservers at your domain registrar
- Verify DNS propagation: https://www.whatsmydns.net/#A/quinnjr.dev
- Check DigitalOcean DNS dashboard

### SSL certificate issues
- DigitalOcean automatically provisions Let's Encrypt certificates
- May take 5-10 minutes after domain configuration
- Check App Platform settings in DigitalOcean dashboard

### App not accessible
- Verify Terraform was applied successfully
- Check App Platform deployment status
- Review application logs in DigitalOcean dashboard

## Related Files

- `tf/terraform.tfvars` - Domain configuration (not in git, contains secrets)
- `tf/terraform.tfvars.example` - Example configuration
- `tf/variables.tf` - Variable definitions including domain_name
- `tf/main.tf` - Domain and app configuration resources

## Next Deployment

The domain configuration will be applied on the next Terraform deployment:

```bash
cd tf
terraform plan -var="github_api_token=$GITHUB_API_TOKEN"
terraform apply -var="github_api_token=$GITHUB_API_TOKEN"
```

Or via GitHub Actions when code is merged to main.


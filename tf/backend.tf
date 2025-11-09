# Terraform Backend Configuration for DigitalOcean Spaces
# Official documentation: https://docs.digitalocean.com/products/spaces/reference/terraform-backend/

terraform {
  required_version = ">= 1.6.3"

  backend "s3" {
    # DigitalOcean Spaces endpoint
    # Replace nyc3 with your bucket's region (nyc3, sfo3, sgp1, fra1, ams3, etc.)
    endpoints = {
      s3 = "https://nyc3.digitaloceanspaces.com"
    }

    # Your Spaces bucket name
    bucket = "quinnjr-terraform"

    # State file path (can use directories like "production/terraform.tfstate")
    key    = "terraform.tfstate"

    # Deactivate AWS-specific checks
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_s3_checksum            = true
    region                      = "us-east-1"
  }
}

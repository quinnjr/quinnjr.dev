# Terraform Backend Configuration

terraform {
  backend "s3" {
    # Replace with your Space name
    bucket = "quinnjr-terraform"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    # DigitalOcean Spaces endpoint (adjust region as needed)
    # nyc3, sfo3, sgp1, fra1, ams3, etc.
    endpoint = "https://nyc3.digitaloceanspaces.com"

    # Disable AWS-specific features
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    # Use path-style access for DigitalOcean Spaces
    force_path_style = true
  }
}

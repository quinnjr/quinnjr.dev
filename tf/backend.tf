terraform {
  backend "s3" {
    bucket = "terraform-state"
    key    = "quinnjr-dev/terraform.tfstate"
    region = "us-east-1"

    endpoints = {
      s3 = "http://127.0.0.1:9000"
    }

    # Your Spaces bucket name
    bucket = "quinnjr-terraform"

    # State file path (can use directories like "production/terraform.tfstate")
    key = "terraform.tfstate"

    # Deactivate AWS-specific checks
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    use_path_style              = true
  }
}

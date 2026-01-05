# Digital Ocean API Token
variable "do_token" {
  description = "Digital Ocean API Token"
  type        = string
  sensitive   = true
}

# SSH Configuration
variable "ssh_key_name" {
  description = "Name for the SSH key in Digital Ocean"
  type        = string
  default     = "quinnjr-deployment"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

# Droplet Configuration
variable "droplet_name" {
  description = "Name of the droplet"
  type        = string
  default     = "quinnjr-dev"
}

variable "region" {
  description = "Digital Ocean region"
  type        = string
  default     = "nyc3"

  validation {
    condition     = contains(["nyc1", "nyc3", "sfo3", "lon1", "fra1", "tor1", "sgp1", "blr1", "ams3"], var.region)
    error_message = "Region must be a valid Digital Ocean region."
  }
}

variable "droplet_size" {
  description = "Droplet size/plan"
  type        = string
  default     = "s-1vcpu-1gb"  # $6/month - cheapest option

  validation {
    condition     = can(regex("^s-", var.droplet_size))
    error_message = "Use Basic droplet sizes (s-*) for cost efficiency."
  }
}

variable "droplet_image" {
  description = "Droplet OS image"
  type        = string
  default     = "ubuntu-22-04-x64"
}

variable "enable_backups" {
  description = "Enable Digital Ocean automated backups ($1.20/month)"
  type        = bool
  default     = false  # We use our own backup scripts (free)
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name (leave empty for IP-only)"
  type        = string
  default     = ""
}

# Project Configuration
variable "create_project" {
  description = "Create a Digital Ocean project"
  type        = bool
  default     = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "quinnjr-dev"
}

variable "environment" {
  description = "Environment (Development, Staging, Production)"
  type        = string
  default     = "Production"

  validation {
    condition     = contains(["Development", "Staging", "Production"], var.environment)
    error_message = "Environment must be Development, Staging, or Production."
  }
}

# Tags
variable "tags" {
  description = "Tags for the droplet"
  type        = list(string)
  default     = ["quinnjr-dev", "production", "terraform"]
}

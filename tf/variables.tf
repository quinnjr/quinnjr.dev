variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "quinnjr-tech"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "docker_image" {
  description = "Docker image to deploy (from GitHub Container Registry)"
  type        = string
  default     = "ghcr.io/quinnjr/quinnjr.tech:latest"
}

variable "app_port" {
  description = "Port the application runs on"
  type        = number
  default     = 4000
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "quinnjr_tech_db"
}

variable "db_user" {
  description = "PostgreSQL database user"
  type        = string
  default     = "quinnjr_tech_user"
}

variable "github_username" {
  description = "GitHub username for container registry access"
  type        = string
  default     = "quinnjr"
}

variable "github_token" {
  description = "GitHub Personal Access Token (PAT) for container registry access"
  type        = string
  sensitive   = true
}

variable "node_env" {
  description = "Node environment (production/development)"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Custom domain name for the application (e.g., quinnjr.tech)"
  type        = string
  default     = ""
}

variable "enable_dns" {
  description = "Enable DNS management through DigitalOcean (domain must be managed by DigitalOcean)"
  type        = bool
  default     = false
}


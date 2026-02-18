variable "app_name" {
  description = "Application name"
  type        = string
  default     = "quinnjr-dev"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "quinnjr.dev"
}

variable "docker_image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "host_port" {
  description = "Host port to expose the app on (behind Ferron)"
  type        = number
  default     = 4300
}

variable "postgres_port" {
  description = "Host port to expose PostgreSQL on"
  type        = number
  default     = 5433
}

variable "data_dir" {
  description = "Host directory for persistent data"
  type        = string
  default     = "/opt/quinnjr-dev/data"
}

variable "repo_path" {
  description = "Path to the local repository"
  type        = string
  default     = "/home/joseph/quinnjr.dev"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "github_token" {
  description = "GitHub API token for fetching repositories"
  type        = string
  sensitive   = true
  default     = ""
}

# Domain Data Source (reference existing domain)
data "digitalocean_domain" "app_domain" {
  count = var.enable_dns && var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# =============================================================================
# PostgreSQL
# =============================================================================

resource "docker_image" "postgres" {
  name = "postgres:16-alpine"
}

resource "docker_container" "postgres" {
  name  = "${var.app_name}-postgres"
  image = docker_image.postgres.image_id

  restart = "unless-stopped"

    # Database
    database {
      name         = "${var.project_name}-db"
      engine       = "PG"
      production   = false
      cluster_name = digitalocean_database_cluster.quinnjr_postgres.name
    }

  ports {
    internal = 5432
    external = var.postgres_port
    ip       = "127.0.0.1"
  }

      # Docker image from GitHub Container Registry
      image {
        registry_type = "GHCR"
        registry      = "ghcr.io"
        repository    = "${var.github_username}/quinnjr.dev"
        tag           = var.docker_image_tag

  env = [
    "POSTGRES_DB=quinnjr",
    "POSTGRES_USER=quinnjr",
    "POSTGRES_PASSWORD=${var.postgres_password}",
  ]

  healthcheck {
    test         = ["CMD-SHELL", "pg_isready -U quinnjr"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 5
    start_period = "30s"
  }

  must_run = true
}

# =============================================================================
# Application
# =============================================================================

resource "docker_image" "app" {
  name = "${var.app_name}:${var.docker_image_tag}"

  build {
    context    = var.repo_path
    dockerfile = "Dockerfile"
    tag        = ["${var.app_name}:${var.docker_image_tag}"]
  }

  triggers = {
    dockerfile_hash = filesha256("${var.repo_path}/Dockerfile")
    pnpm_lock_hash  = filesha256("${var.repo_path}/pnpm-lock.yaml")
    schema_hash     = filesha256("${var.repo_path}/prisma/schema.prisma")
  }
}

# Note: DNS records are managed automatically by DigitalOcean App Platform
# when a custom domain is configured in the app spec.
# Manual DNS record creation is not needed as App Platform handles this
# through its domain configuration and provides the necessary CNAME/A records.

output "local_url" {
  description = "Local URL (behind Ferron reverse proxy)"
  value       = "http://127.0.0.1:${var.host_port}"
}

output "postgres_container" {
  description = "PostgreSQL container name"
  value       = docker_container.postgres.name
}

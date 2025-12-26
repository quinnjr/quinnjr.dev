# Domain Data Source (reference existing domain)
data "digitalocean_domain" "app_domain" {
  count = var.enable_dns && var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# Managed PostgreSQL Database
resource "digitalocean_database_cluster" "quinnjr_postgres" {
  name       = "${var.project_name}-db"
  engine     = "pg"
  version    = "16"
  size       = "db-s-1vcpu-1gb" # Smallest managed DB: $15/month
  region     = var.region
  node_count = 1
}

# App Platform App
resource "digitalocean_app" "quinnjr_dev" {
  spec {
    name   = var.project_name
    region = var.region

    # Custom domain configuration
    dynamic "domain" {
      for_each = var.domain_name != "" ? [1] : []
      content {
        name = var.domain_name
        type = "PRIMARY"
        zone = var.domain_name
      }
    }

    # Database
    database {
      name         = "${var.project_name}-db"
      engine       = "PG"
      production   = false
      cluster_name = digitalocean_database_cluster.quinnjr_postgres.name
    }

    # Service (Docker container)
    service {
      name               = "${var.project_name}-web"
      instance_count     = 1
      instance_size_slug = "basic-xxs" # Smallest: $5/month, 512MB RAM, 1 vCPU

      # Docker image from GitHub Container Registry
      image {
        registry_type = "GHCR"
        registry      = "ghcr.io"
        repository    = "${var.github_username}/quinnjr.dev"
        tag           = "main"

        deploy_on_push {
          enabled = true
        }

        # GitHub Container Registry credentials (format: username:token)
        registry_credentials = "${var.github_username}:${var.github_token}"
      }

      # Health check
      health_check {
        http_path             = "/"
        initial_delay_seconds = 30
        period_seconds        = 10
        timeout_seconds       = 5
        success_threshold     = 1
        failure_threshold     = 3
      }

      # HTTP port
      http_port = var.app_port

      # Environment variables
      env {
        key   = "PORT"
        value = tostring(var.app_port)
      }

      env {
        key   = "NODE_ENV"
        value = var.node_env
      }

      # PostgreSQL database URL
      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.quinnjr_postgres.uri
        type  = "SECRET"
      }

      # GitHub API token for fetching repositories
      env {
        key   = "GITHUB_TOKEN"
        value = var.github_api_token
        type  = "SECRET"
      }
    }

    # Alerts
    alert {
      rule = "DEPLOYMENT_FAILED"
    }

    alert {
      rule = "DOMAIN_FAILED"
    }
  }
}

# Note: DNS records are managed automatically by DigitalOcean App Platform
# when a custom domain is configured in the app spec.
# Manual DNS record creation is not needed as App Platform handles this
# through its domain configuration and provides the necessary CNAME/A records.


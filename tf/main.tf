# Domain Resource (if using DigitalOcean DNS)
resource "digitalocean_domain" "app_domain" {
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
      name       = "${var.project_name}-db"
      engine     = "PG"
      production = false
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
        tag           = "latest"

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

      # PostgreSQL database URL (automatically injected by App Platform)
      # DATABASE_URL will be available as ${db.DATABASE_URL}

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

# DNS Records for the custom domain
# A record for apex domain (e.g., quinnjr.dev)
resource "digitalocean_record" "apex" {
  count  = var.enable_dns && var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.app_domain[0].name
  type   = "A"
  name   = "@"
  value  = digitalocean_app.quinnjr_dev.default_ingress
  ttl    = 300

  depends_on = [digitalocean_app.quinnjr_dev]
}

# CNAME record for www subdomain
resource "digitalocean_record" "www" {
  count  = var.enable_dns && var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.app_domain[0].name
  type   = "CNAME"
  name   = "www"
  value  = "${digitalocean_app.quinnjr_dev.default_ingress}."
  ttl    = 300

  depends_on = [digitalocean_app.quinnjr_dev]
}

# TXT record for domain verification (if needed by App Platform)
resource "digitalocean_record" "verification" {
  count  = var.enable_dns && var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.app_domain[0].name
  type   = "TXT"
  name   = "_app"
  value  = digitalocean_app.quinnjr_dev.id
  ttl    = 300

  depends_on = [digitalocean_app.quinnjr_dev]
}


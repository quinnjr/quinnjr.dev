# PostgreSQL Database Cluster
# Using the smallest available size (db-s-1vcpu-1gb)
resource "digitalocean_database_cluster" "postgres" {
  name       = "${var.project_name}-postgres"
  engine     = "pg"
  version    = "16"
  size       = "db-s-1vcpu-1gb" # Smallest available: 1 vCPU, 1GB RAM, 10GB disk
  region     = var.region
  node_count = 1

  tags = ["${var.project_name}", "postgres"]
}

# Database within the cluster
resource "digitalocean_database_db" "app_database" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = var.db_name
}

# Database user
resource "digitalocean_database_user" "app_user" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = var.db_user
}

# Container Registry credentials for GitHub Container Registry
resource "digitalocean_container_registry_docker_credentials" "github_registry" {
  registry_name = "ghcr.io"
  write         = false
}

# Domain Resource (if using DigitalOcean DNS)
resource "digitalocean_domain" "app_domain" {
  count = var.enable_dns && var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# App Platform App
resource "digitalocean_app" "quinnjr_tech" {
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

    # Service (Docker container)
    service {
      name               = "${var.project_name}-web"
      instance_count     = 1
      instance_size_slug = "basic-xxs" # Smallest: $5/month, 512MB RAM, 1 vCPU

      # Docker image from GitHub Container Registry
      image {
        registry_type = "GHCR"
        registry      = "ghcr.io"
        repository    = "${var.github_username}/quinnjr.tech"
        tag           = "latest"

        deploy_on_push {
          enabled = true
        }

        # GitHub Container Registry credentials
        registry_credentials = var.github_token
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

      # Database connection URL for Prisma
      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.postgres.uri
        type  = "SECRET"
      }

      # Direct database connection (if needed)
      env {
        key   = "DB_HOST"
        value = digitalocean_database_cluster.postgres.host
      }

      env {
        key   = "DB_PORT"
        value = tostring(digitalocean_database_cluster.postgres.port)
      }

      env {
        key   = "DB_NAME"
        value = digitalocean_database_db.app_database.name
      }

      env {
        key   = "DB_USER"
        value = digitalocean_database_user.app_user.name
      }

      env {
        key   = "DB_PASSWORD"
        value = digitalocean_database_user.app_user.password
        type  = "SECRET"
      }

      env {
        key   = "DB_SSL"
        value = "true"
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

# Firewall rule to allow App Platform to access the database
resource "digitalocean_database_firewall" "app_access" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "app"
    value = digitalocean_app.quinnjr_tech.id
  }
}

# DNS Records for the custom domain
# A record for apex domain (e.g., quinnjr.tech)
resource "digitalocean_record" "apex" {
  count  = var.enable_dns && var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.app_domain[0].name
  type   = "A"
  name   = "@"
  value  = digitalocean_app.quinnjr_tech.default_ingress
  ttl    = 300

  depends_on = [digitalocean_app.quinnjr_tech]
}

# CNAME record for www subdomain
resource "digitalocean_record" "www" {
  count  = var.enable_dns && var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.app_domain[0].name
  type   = "CNAME"
  name   = "www"
  value  = "${digitalocean_app.quinnjr_tech.default_ingress}."
  ttl    = 300

  depends_on = [digitalocean_app.quinnjr_tech]
}

# TXT record for domain verification (if needed by App Platform)
resource "digitalocean_record" "verification" {
  count  = var.enable_dns && var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.app_domain[0].name
  type   = "TXT"
  name   = "_app"
  value  = digitalocean_app.quinnjr_tech.id
  ttl    = 300

  depends_on = [digitalocean_app.quinnjr_tech]
}


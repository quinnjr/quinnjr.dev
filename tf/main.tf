# quinnjr.dev — Local Docker Deployment
# Builds from local Dockerfile and runs behind Ferron reverse proxy

# =============================================================================
# Network
# =============================================================================

resource "docker_network" "app" {
  name = "${var.app_name}-network"
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

  networks_advanced {
    name = docker_network.app.name
  }

  ports {
    internal = 5432
    external = var.postgres_port
    ip       = "127.0.0.1"
  }

  volumes {
    host_path      = "${var.data_dir}/postgres"
    container_path = "/var/lib/postgresql/data"
  }

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

resource "docker_container" "app" {
  name  = var.app_name
  image = docker_image.app.image_id

  restart = "unless-stopped"

  depends_on = [docker_container.postgres]

  networks_advanced {
    name = docker_network.app.name
  }

  ports {
    internal = 4000
    external = var.host_port
    ip       = "127.0.0.1"
  }

  env = [
    "NODE_ENV=production",
    "PORT=4000",
    "DATABASE_URL=postgresql://quinnjr:${var.postgres_password}@${var.app_name}-postgres:5432/quinnjr?schema=public",
    "GITHUB_TOKEN=${var.github_token}",
  ]

  healthcheck {
    test         = ["CMD", "node", "-e", "fetch('http://localhost:4000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
    interval     = "30s"
    timeout      = "10s"
    retries      = 3
    start_period = "60s"
  }

  must_run = true
}

# =============================================================================
# Outputs
# =============================================================================

output "container_id" {
  description = "Docker container ID"
  value       = docker_container.app.id
}

output "container_name" {
  description = "Docker container name"
  value       = docker_container.app.name
}

output "local_url" {
  description = "Local URL (behind Ferron reverse proxy)"
  value       = "http://127.0.0.1:${var.host_port}"
}

output "postgres_container" {
  description = "PostgreSQL container name"
  value       = docker_container.postgres.name
}

output "app_url" {
  description = "URL of the deployed application"
  value       = "https://${digitalocean_app.quinnjr_tech.default_ingress}"
}

output "app_live_url" {
  description = "Live URL of the deployed application"
  value       = digitalocean_app.quinnjr_tech.live_url
}

output "database_host" {
  description = "PostgreSQL database host"
  value       = digitalocean_database_cluster.postgres.host
}

output "database_port" {
  description = "PostgreSQL database port"
  value       = digitalocean_database_cluster.postgres.port
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = digitalocean_database_db.app_database.name
}

output "database_user" {
  description = "PostgreSQL database user"
  value       = digitalocean_database_user.app_user.name
}

output "database_password" {
  description = "PostgreSQL database password"
  value       = digitalocean_database_user.app_user.password
  sensitive   = true
}

output "database_url" {
  description = "PostgreSQL connection URL (for Prisma)"
  value       = digitalocean_database_cluster.postgres.uri
  sensitive   = true
}

output "database_connection_string" {
  description = "PostgreSQL connection string with user credentials"
  value       = "postgresql://${digitalocean_database_user.app_user.name}:${digitalocean_database_user.app_user.password}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/${digitalocean_database_db.app_database.name}?sslmode=require"
  sensitive   = true
}

output "custom_domain" {
  description = "Custom domain configured for the application"
  value       = var.domain_name != "" ? var.domain_name : "Not configured"
}

output "dns_nameservers" {
  description = "DigitalOcean nameservers for domain configuration"
  value       = var.enable_dns && var.domain_name != "" ? digitalocean_domain.app_domain[0].name : "DNS not managed by DigitalOcean"
}

output "dns_records" {
  description = "DNS records created for the domain"
  value = var.enable_dns && var.domain_name != "" ? {
    apex_record = "@ -> ${digitalocean_app.quinnjr_tech.default_ingress}"
    www_record  = "www -> ${digitalocean_app.quinnjr_tech.default_ingress}"
  } : {}
}

output "app_default_url" {
  description = "Default DigitalOcean App Platform URL"
  value       = digitalocean_app.quinnjr_tech.default_ingress
}


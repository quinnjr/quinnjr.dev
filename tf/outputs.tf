output "app_url" {
  description = "URL of the deployed application"
  value       = "https://${digitalocean_app.quinnjr_dev.default_ingress}"
}

output "app_live_url" {
  description = "Live URL of the deployed application"
  value       = digitalocean_app.quinnjr_dev.live_url
}

output "database_path" {
  description = "SQLite database file path"
  value       = "/data/quinnjr.db"
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
    apex_record = "@ -> ${digitalocean_app.quinnjr_dev.default_ingress}"
    www_record  = "www -> ${digitalocean_app.quinnjr_dev.default_ingress}"
  } : {}
}

output "app_default_url" {
  description = "Default DigitalOcean App Platform URL"
  value       = digitalocean_app.quinnjr_dev.default_ingress
}


output "droplet_id" {
  description = "The ID of the droplet"
  value       = digitalocean_droplet.web.id
}

output "droplet_name" {
  description = "The name of the droplet"
  value       = digitalocean_droplet.web.name
}

output "droplet_ip" {
  description = "The public IP address of the droplet"
  value       = digitalocean_droplet.web.ipv4_address
}

output "droplet_region" {
  description = "The region of the droplet"
  value       = digitalocean_droplet.web.region
}

output "droplet_size" {
  description = "The size of the droplet"
  value       = digitalocean_droplet.web.size
}

output "droplet_cost" {
  description = "Monthly cost of the droplet"
  value       = "$6/month"
}

output "ssh_command" {
  description = "SSH command to connect to the droplet"
  value       = "ssh root@${digitalocean_droplet.web.ipv4_address}"
}

output "domain_nameservers" {
  description = "Nameservers for the domain (if created)"
  value       = var.domain_name != "" ? "ns1.digitalocean.com, ns2.digitalocean.com, ns3.digitalocean.com" : "N/A (no domain configured)"
}

output "website_url" {
  description = "URL of the website"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${digitalocean_droplet.web.ipv4_address}"
}

output "firewall_id" {
  description = "The ID of the firewall"
  value       = digitalocean_firewall.web.id
}

output "ssh_key_fingerprint" {
  description = "SSH key fingerprint"
  value       = digitalocean_ssh_key.default.fingerprint
}

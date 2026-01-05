terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# SSH Key
resource "digitalocean_ssh_key" "default" {
  name       = var.ssh_key_name
  public_key = file(var.ssh_public_key_path)
}

# Droplet
resource "digitalocean_droplet" "web" {
  name   = var.droplet_name
  region = var.region
  size   = var.droplet_size
  image  = var.droplet_image

  ssh_keys = [digitalocean_ssh_key.default.fingerprint]

  # Enable monitoring (free)
  monitoring = true

  # Enable backups (optional - $1.20/month)
  backups = var.enable_backups

  # User data for initial setup
  user_data = file("${path.module}/cloud-init.yml")

  tags = var.tags
}

# Firewall
resource "digitalocean_firewall" "web" {
  name = "${var.droplet_name}-firewall"

  droplet_ids = [digitalocean_droplet.web.id]

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Application port (for testing)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "4000"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Domain (optional)
resource "digitalocean_domain" "default" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# DNS Records (optional)
resource "digitalocean_record" "root" {
  count  = var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.default[0].name
  type   = "A"
  name   = "@"
  value  = digitalocean_droplet.web.ipv4_address
  ttl    = 30
}

resource "digitalocean_record" "www" {
  count  = var.domain_name != "" ? 1 : 0
  domain = digitalocean_domain.default[0].name
  type   = "A"
  name   = "www"
  value  = digitalocean_droplet.web.ipv4_address
  ttl    = 30
}

# Project (optional - organize resources)
resource "digitalocean_project" "quinnjr_dev" {
  count       = var.create_project ? 1 : 0
  name        = var.project_name
  description = "QuinnJR.dev - Personal resume and portfolio site"
  purpose     = "Web Application"
  environment = var.environment

  resources = [
    digitalocean_droplet.web.urn,
  ]
}

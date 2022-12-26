output "lb_hostname" {
  value = aws_lb.main.dns_name
}

output "ns-servers" {
  value = aws_route53_zone.quinnjr-tech.name_servers
}

resource "aws_route53_zone" "quinnjr-tech" {
  name = "quinnjr.tech"
}

resource "aws_route53_record" "quinnjr-tech-a" {
  zone_id = aws_route53_zone.quinnjr-tech.zone_id
  name = "quinnjr.tech"
  type = "A"
  ttl = 300
  records = [aws_eip.lb.public_ip]
}

resource "aws_route53_record" "quinnjr-tech-certs" {
  for_each = {
    for dvo in aws_acm_certificate.my-cert.domain_validation_options : dvo.domain_name => {
      name = dvo.resource_record_name
      record = dvo.resource_record_value
      type = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name = each.value.name
  records = [each.value.record]
  ttl = 60
  type = each.value.type
  zone_id = aws_route53_zone.quinnjr-tech.zone_id
}

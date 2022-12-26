resource "aws_acm_certificate" "my-cert" {
  domain_name = "quinnjr.tech"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

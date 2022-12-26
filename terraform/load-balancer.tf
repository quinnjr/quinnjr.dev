resource "aws_lb" "main" {
  name = "quinnjr-tech-load-balancer"
  subnets = aws_subnet.main-public.*.id
  load_balancer_type = "application"
  security_groups = [aws_security_group.lb.id]

  enable_deletion_protection = true

  tags = {
    Environment = "production"
  }
}

resource "aws_lb_target_group" "main" {
  name = "quinnjr-tech-target-group"
  port = 443
  protocol = "HTTPS"
  vpc_id = aws_vpc.main.id
  target_type = "ip"

  health_check {
    healthy_threshold = 3
    interval = 30
    protocol = "HTTP"
    matcher = "200"
    timeout = 3
    path = "/"
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port = 4200
  protocol = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.main.id
    type = "forward"
  }
}

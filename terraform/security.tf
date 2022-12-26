resource "aws_security_group" "lb" {
  name = "quinnjr-tech-load-balancer-security-group"
  description = "controls access to the alb"
  vpc_id = aws_vpc.main.id

  ingress {
    protocol = "tcp"
    from_port = 4200
    to_port = 4200
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol = "-1"
    from_port = 0
    to_port = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs-tasks" {
  name        = "quinnjr-tech-ecs-tasks-security-group"
  description = "allow inbound access from the ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = 4200
    to_port         = 4200
    security_groups = [aws_security_group.lb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

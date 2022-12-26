resource "aws_cloudwatch_log_group" "website-log-group" {
  name = "/ecs/quinnjr-tech-app"
  retention_in_days = 30

  tags = {
    Name = "quinnjr-tech-log-group"
  }
}

resource "aws_cloudwatch_log_stream" "website-log-stream" {
  name = "quinnjr-tech-log-stream"
  log_group_name = aws_cloudwatch_log_group.website-log-group.name
}

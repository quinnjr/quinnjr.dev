resource "aws_ecs_cluster" "website" {
  name = "website"
}

resource "aws_ecs_task_definition" "website" {
  family = "quinnjr-tech-app-task"
  execution_role_arn = aws_iam_role.ecs-task-execution-role.arn
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = 512
  memory = 1024
  container_definitions = jsonencode([
    {
      name = "quinnjr-tech-app"
      image = "ghcr.io/quinnjr/quinnjr.tech:latest"
      repositoryCredentials = {
        credentialsParameter = aws_secretsmanager_secret.github-login.arn
      },
      cpu = 512
      memory = 1024
      networkMode = "awsvpc"
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = "/ecs/quinnjr-tech-app"
          "awslogs-region" = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      },
      portMappings = [
        {
          containerPort = 4200
          hostPort = 4200
        }
      ],
      secrets = [
        {
          name = "DATABASE_URL",
          valueFrom = aws_secretsmanager_secret.database-url.arn
        },
        {
          name = "GH_TOKEN",
          valueFrom = aws_secretsmanager_secret.gh-runtime-token.arn
        },
        {
          name = "JWT_SECRET"
          valueFrom = random_password.jwt-secret.result
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "website" {
  name = "quinnjr-tech-service"
  cluster = aws_ecs_cluster.website.id
  task_definition = aws_ecs_task_definition.website.arn
  desired_count = 1
  launch_type = "FARGATE"

  network_configuration {
    security_groups = [aws_security_group.ecs-tasks.id]
    subnets = aws_subnet.main-private.*.id
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.id
    container_name = "quinnjr-tech-app"
    container_port = 4200
  }

  depends_on = [
    aws_lb_listener.main,
    aws_iam_role_policy_attachment.ecs-task-execution-role,
    aws_ecs_task_definition.website
  ]
}

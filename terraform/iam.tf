resource "aws_iam_group" "administrators" {
  name = "administrators"
}

resource "aws_iam_policy_attachment" "administrators-attach" {
  name = "administrators-attach"
  groups = ["${aws_iam_group.administrators.name}"]
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

data "aws_iam_policy_document" "ecs-task-execution-role" {
  version = "2012-10-17"

  statement {
    sid = ""
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]

    principals {
      type = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs-task-execution-role" {
  name = "quinnjr-tech-ecs-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs-task-execution-role.json
}

resource "aws_iam_role_policy_attachment" "ecs-task-execution-role" {
  role = aws_iam_role.ecs-task-execution-role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ecs-allow-secrets" {
  description = "Allow ECS to read secrets"
  name = "ecs-allow-secrets"
  path = "/"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetRandomPassword",
          "secretsmanager:GetResourcePolicy",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecretVersionIds",
          "secretsmanager:ListSecrets",
        ]
        Effect   = "Allow"
        Resource = "*"
        Sid      = "VisualEditor0"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "ecs-allow-secrets" {
  name = "ecs-allow-secrets"
  roles = [aws_iam_role.ecs-task-execution-role.name]
  policy_arn = aws_iam_policy.ecs-allow-secrets.arn
}

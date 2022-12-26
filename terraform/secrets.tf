resource "random_password" "database-password" {
  length = 32
  special = false
  min_lower = 1
  min_upper = 1
  min_numeric = 1
  min_special = 0
  override_special = "_%@\"/"
}

resource "random_password" "jwt-secret" {
  length = 32
  special = true
  min_lower = 1
  min_upper = 1
  min_numeric = 1
  min_special = 1
  override_special = "_%@\"/"
}

resource "aws_secretsmanager_secret" "github-login" {
  name = "github-login"
  description = "Login credentials for GitHub"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "github-login" {
  secret_id = aws_secretsmanager_secret.github-login.id
  secret_string = jsonencode(
    {
      username = var.GH_USERNAME
      password = var.GH_TOKEN
    }
  )
}

resource "aws_secretsmanager_secret" "gh-runtime-token" {
  name = "github-runtime-token"
  description = "Token to use for querying the github api"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "gh-runtime-token" {
  secret_id = aws_secretsmanager_secret.gh-runtime-token.id
  secret_string = var.GH_RUNTIME_TOKEN
}

resource "aws_secretsmanager_secret" "database-url" {
  name = "database-url"
  description = "Connection URI for the database"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "database-url" {
  secret_id = aws_secretsmanager_secret.database-url.id
  secret_string = "postgres://${aws_db_instance.default.username}:${aws_ssm_parameter.database-password.value}@:${aws_db_instance.default.address}:${aws_db_instance.default.port}/${aws_db_instance.default.db_name}"
}

resource "aws_ssm_parameter" "database-password" {
  name = "database-password"
  description = "Production environment database password"
  type = "SecureString"
  value = random_password.database-password.result
}

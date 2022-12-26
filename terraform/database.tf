resource "aws_db_instance" "default" {
  allocated_storage = 5
  engine = "postgres"
  identifier = "quinnjr-tech"
  engine_version = "14"
  instance_class = "db.t3.micro"
  db_name = "quinnjr_tech"
  username = "quinnjr"
  password = aws_ssm_parameter.database-password.value
  skip_final_snapshot = true
  publicly_accessible = false
  auto_minor_version_upgrade = true
  storage_type = "gp2"
  db_subnet_group_name = aws_db_subnet_group.default.id
}

resource "aws_db_subnet_group" "default" {
  name = "main"
  subnet_ids = [aws_subnet.main-private[0].id, aws_subnet.main-private[1].id]
}

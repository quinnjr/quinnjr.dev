/* resource "aws_appautoscaling_target" "target" {
  service_namespace = "ecs"
  resource_id = "services/${aws_ecs_cluster.website.name}/${aws_ecs_cluster.website.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity = 1
  max_capacity = 1
} */

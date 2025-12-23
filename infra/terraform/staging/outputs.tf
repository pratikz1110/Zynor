output "ecr_repository_url" {
  value       = aws_ecr_repository.zynor_api.repository_url
  description = "ECR repository URL for zynor-api"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.staging.name
}

output "ecs_service_name" {
  value = aws_ecs_service.zynor_api.name
}

output "api_security_group_id" {
  value = aws_security_group.zynor_api.id
}

output "rds_endpoint" {
  value       = aws_db_instance.zynor_staging.address
  description = "RDS endpoint hostname"
}











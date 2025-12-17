output "ecr_repository_url" {
  value       = aws_ecr_repository.zynor_api.repository_url
  description = "ECR repository URL for zynor-api"
}


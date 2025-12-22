variable "aws_region" {
  type        = string
  description = "AWS region for staging resources"
}

variable "tags" {
  type        = map(string)
  description = "Common tags applied to resources"
  default = {
    Project     = "zynor"
    Environment = "staging"
    ManagedBy   = "terraform"
  }
}

variable "db_username" {
  type        = string
  description = "Staging RDS master username"
}

variable "db_password" {
  type        = string
  description = "Staging RDS master password"
  sensitive   = true
}










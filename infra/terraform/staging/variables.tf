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


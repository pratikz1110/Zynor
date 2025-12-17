resource "aws_ecr_repository" "zynor_api" {
  name                 = "zynor-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = var.tags
}

resource "aws_ecr_lifecycle_policy" "zynor_api" {
  repository = aws_ecr_repository.zynor_api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 20 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

############################
# Data: default VPC + subnets
############################
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

############################
# CloudWatch logs
############################
resource "aws_cloudwatch_log_group" "zynor_api" {
  name              = "/ecs/zynor-api-staging"
  retention_in_days = 7
  tags              = var.tags
}

############################
# ECS Cluster
############################
resource "aws_ecs_cluster" "staging" {
  name = "zynor-staging"
  tags = var.tags
}

############################
# Security Group (public, simple)
############################
resource "aws_security_group" "zynor_api" {
  name        = "zynor-api-staging-sg"
  description = "Allow HTTP to Zynor API (staging)"
  vpc_id      = data.aws_vpc.default.id
  tags        = var.tags

  ingress {
    description = "API"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

############################
# IAM: Task execution role
############################
resource "aws_iam_role" "ecs_task_execution" {
  name = "zynor-ecs-task-exec-staging"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = { Service = "ecs-tasks.amazonaws.com" }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

############################
# ECS Task Definition
############################
resource "aws_ecs_task_definition" "zynor_api" {
  family                   = "zynor-api-staging"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "zynor-api"
      image     = "589668342400.dkr.ecr.us-west-1.amazonaws.com/zynor-api:staging"
      essential = true
      portMappings = [
        { containerPort = 8000, hostPort = 8000, protocol = "tcp" }
      ]
      environment = [
        # NOTE: We'll move secrets to Secrets Manager later.
        { name = "ENVIRONMENT", value = "staging" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.zynor_api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = var.tags
}

############################
# ECS Service (idle by default)
############################
resource "aws_ecs_service" "zynor_api" {
  name            = "zynor-api-staging"
  cluster         = aws_ecs_cluster.staging.id
  task_definition = aws_ecs_task_definition.zynor_api.arn
  desired_count   = 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.zynor_api.id]
    assign_public_ip = true
  }

  tags = var.tags
}


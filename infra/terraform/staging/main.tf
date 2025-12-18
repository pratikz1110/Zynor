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

resource "aws_iam_policy" "ecs_read_staging_secret" {
  name        = "zynor-ecs-read-staging-secret"
  description = "Allow ECS tasks to read Zynor staging secrets"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = "arn:aws:secretsmanager:us-west-1:589668342400:secret:zynor/staging/zynor-api-IlmEul"
      }
    ]
  })
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_read_staging_secret" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.ecs_read_staging_secret.arn
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
        { name = "ENVIRONMENT", value = "staging" }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "arn:aws:secretsmanager:us-west-1:589668342400:secret:zynor/staging/zynor-api-IlmEul:DATABASE_URL::"
        }
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
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.zynor_api.id]
    assign_public_ip = true
  }

  tags = var.tags
}

############################
# RDS (Postgres) - minimal staging
############################

resource "aws_db_subnet_group" "zynor_staging" {
  name       = "zynor-staging-db-subnets"
  subnet_ids = [
    "subnet-0cb8e0eb817f93b34", # us-west-1c
    "subnet-037781caca595e0ad"  # us-west-1a
  ]
  tags = var.tags
}

resource "aws_security_group" "zynor_rds" {
  name        = "zynor-rds-staging-sg"
  description = "Allow Postgres from ECS tasks only (staging)"
  vpc_id      = "vpc-0b5cbdff5bf90c22c"
  tags        = var.tags

  ingress {
    description     = "Postgres from ECS API SG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.zynor_api.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "zynor_staging" {
  identifier              = "zynor-staging-db"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = "db.t4g.micro"
  allocated_storage       = 20
  storage_type            = "gp3"

  db_name                 = "zynor"
  username                = var.db_username
  password                = var.db_password

  db_subnet_group_name    = aws_db_subnet_group.zynor_staging.name
  vpc_security_group_ids  = [aws_security_group.zynor_rds.id]

  publicly_accessible     = true
  skip_final_snapshot     = true
  deletion_protection     = false
  backup_retention_period = 1
  apply_immediately       = true

  tags = var.tags
}






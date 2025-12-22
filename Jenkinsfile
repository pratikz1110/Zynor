pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Sanity') {
            steps {
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Prep: Git SHA + Image URI') {
            steps {
                script {
                    def sha = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
                    env.GIT_SHA = sha
                    env.ECR_IMAGE_URI = "589668342400.dkr.ecr.us-west-1.amazonaws.com/zynor-api:${sha}"
                    echo "ECR_IMAGE_URI=${env.ECR_IMAGE_URI}"
                }
            }
        }

        stage('Build API Docker Image') {
            steps {
                sh """
                  docker build -t ${env.ECR_IMAGE_URI} -f apps/api/Dockerfile .
                """
            }
        }

        stage('Push Image to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-zynor'
                ]]) {
                    sh """
                      export AWS_REGION=us-west-1
                      aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin 589668342400.dkr.ecr.us-west-1.amazonaws.com
                      docker push ${env.ECR_IMAGE_URI}
                    """
                }
            }
        }

        stage('Deploy to ECS') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-zynor'
                ]]) {
                    sh """
                      export AWS_REGION=us-west-1
                      export CLUSTER=zynor-staging
                      export SERVICE=zynor-api-staging
                      export FAMILY=zynor-api-staging

                      # 1. Get current task definition
                      aws ecs describe-task-definition \
                        --task-definition \$FAMILY \
                        --query taskDefinition > taskdef.json

                      # 2. Create clean registerable task definition
                      jq '{
                        family: .family,
                        executionRoleArn: .executionRoleArn,
                        networkMode: .networkMode,
                        containerDefinitions: (.containerDefinitions | map(.image = "${env.ECR_IMAGE_URI}")),
                        requiresCompatibilities: .requiresCompatibilities,
                        cpu: .cpu,
                        memory: .memory
                      }' taskdef.json > taskdef-register.json

                      # 3. Register new revision
                      NEW_TASK_DEF_ARN=\$(aws ecs register-task-definition \
                        --cli-input-json file://taskdef-register.json \
                        --query 'taskDefinition.taskDefinitionArn' \
                        --output text)

                      echo "Registered: \$NEW_TASK_DEF_ARN"

                      # 4. Update service
                      aws ecs update-service \
                        --cluster \$CLUSTER \
                        --service \$SERVICE \
                        --task-definition \$NEW_TASK_DEF_ARN
                    """
                }
            }
        }
    }
}

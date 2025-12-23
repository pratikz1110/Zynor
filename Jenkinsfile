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
                sh "docker build -t ${env.ECR_IMAGE_URI} -f apps/api/Dockerfile ."
            }
        }

        stage('Push Image to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-zynor']]) {
                    sh "export AWS_REGION=us-west-1 AWS_DEFAULT_REGION=us-west-1; aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin 589668342400.dkr.ecr.us-west-1.amazonaws.com; docker push ${env.ECR_IMAGE_URI}"
                }
            }
        }

        stage('Deploy to ECS') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-zynor']]) {
                    sh "set -euo pipefail; export AWS_REGION=us-west-1 AWS_DEFAULT_REGION=us-west-1 CLUSTER=zynor-staging SERVICE=zynor-api-staging FAMILY=zynor-api-staging; echo \"Deploying image: ${env.ECR_IMAGE_URI}\"; aws ecs describe-task-definition --task-definition $FAMILY --query taskDefinition > taskdef.json; jq '{ family: .family, executionRoleArn: .executionRoleArn, networkMode: .networkMode, containerDefinitions: (.containerDefinitions | map(.image = \"${env.ECR_IMAGE_URI}\")), requiresCompatibilities: .requiresCompatibilities, cpu: .cpu, memory: .memory }' taskdef.json > taskdef-register.json; NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file://taskdef-register.json --query 'taskDefinition.taskDefinitionArn' --output text); echo \"Registered NEW task definition: $NEW_TASK_DEF_ARN\"; aws ecs update-service --cluster $CLUSTER --service $SERVICE --task-definition $NEW_TASK_DEF_ARN > /dev/null; echo \"Waiting for ECS service to reach steady state...\"; aws ecs wait services-stable --cluster $CLUSTER --services $SERVICE; CURRENT_TASK_DEF=$(aws ecs describe-services --cluster $CLUSTER --services $SERVICE --query 'services[0].taskDefinition' --output text); echo \"Service task definition after deploy: $CURRENT_TASK_DEF\"; if [ \"$CURRENT_TASK_DEF\" != \"$NEW_TASK_DEF_ARN\" ]; then echo \"ERROR: Service is NOT using the newly registered task definition. Possible rollback happened.\"; exit 1; fi; echo \"SUCCESS: Service is running the new task definition.\""
                }
            }
        }

        stage('Post-Deploy Health Check (Public IP)') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-zynor']]) {
                    sh "set -euo pipefail; export AWS_REGION=us-west-1 AWS_DEFAULT_REGION=us-west-1 CLUSTER=zynor-staging SERVICE=zynor-api-staging; TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --desired-status RUNNING --query 'taskArns[0]' --output text); if [ -z \"$TASK_ARN\" ] || [ \"$TASK_ARN\" = \"None\" ]; then echo \"ERROR: No RUNNING task found for service.\"; exit 1; fi; ENI_ID=$(aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ARN --query \"tasks[0].attachments[0].details[?name=='networkInterfaceId'].value | [0]\" --output text); if [ -z \"$ENI_ID\" ] || [ \"$ENI_ID\" = \"None\" ]; then echo \"ERROR: Could not find ENI for task.\"; exit 1; fi; PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text); if [ -z \"$PUBLIC_IP\" ] || [ \"$PUBLIC_IP\" = \"None\" ]; then echo \"ERROR: Could not find Public IP for ENI $ENI_ID\"; exit 1; fi; echo \"Health checking: http://$PUBLIC_IP:8000/health\"; for i in 1 2 3 4 5 6 7 8 9 10; do if curl -fsS --max-time 10 \"http://$PUBLIC_IP:8000/health\"; then echo \"SUCCESS: /health OK\"; exit 0; fi; echo \"Retry $i/10...\"; sleep 6; done; echo \"ERROR: /health failed after retries\"; exit 1"
                }
            }
        }
    }
}

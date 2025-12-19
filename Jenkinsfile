pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out source code..."
                checkout scm
            }
        }

        stage('Sanity') {
            steps {
                echo "Zynor Jenkins CI pipeline running on branch: ${env.BRANCH_NAME}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Prep: Git SHA + Image URI') {
            steps {
                script {
                    def sha = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
                    env.GIT_SHA = sha
                    env.ECR_IMAGE_URI = "589668342400.dkr.ecr.us-west-1.amazonaws.com/zynor-api:${sha}"
                    echo "GIT_SHA=${env.GIT_SHA}"
                    echo "ECR_IMAGE_URI=${env.ECR_IMAGE_URI}"
                }
            }
        }

        stage('Build API Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${env.ECR_IMAGE_URI}"
                    sh """
                      docker build -t ${env.ECR_IMAGE_URI} -f apps/api/Dockerfile .
                    """
                }
            }
        }

        stage('Run API Tests') {
            steps {
                script {
                    def CONTAINER = "zynor-api-tests-${env.BUILD_NUMBER}"
                    // Reuse the same env file credential you already use for the health check
                    withCredentials([file(credentialsId: 'zynor-api-env-file', variable: 'API_ENV_FILE')]) {
                        sh """
                          echo "Running API tests in container..."
                          docker run --rm --name ${CONTAINER} \\
                            --env-file "\$API_ENV_FILE" \\
                            -e TEST_DATABASE_URL=sqlite+pysqlite:////tmp/zynor_test.db \\
                            -e HOME=/tmp \\
                            ${env.ECR_IMAGE_URI} \\
                            sh -c 'PYTHONPATH=/app/apps/api/src python -m pytest -m "unit" apps/api/tests -q'
                        """
                    }
                }
            }
        }

        stage('API Health Check') {
            steps {
                script {
                    def CONTAINER = "zynor-api-healthcheck-${env.BUILD_NUMBER}"
                    withCredentials([file(credentialsId: 'zynor-api-env-file', variable: 'API_ENV_FILE')]) {
                        sh """
                          echo "Running health check..."
                          docker run --rm --name ${CONTAINER} \\
                            --env-file $API_ENV_FILE \\
                            -d ${env.ECR_IMAGE_URI}
                          sleep 5
                          docker exec ${CONTAINER} curl -f http://localhost:8000/health || exit 1
                          docker stop ${CONTAINER}
                        """
                    }
                }
            }
        }
    }
}

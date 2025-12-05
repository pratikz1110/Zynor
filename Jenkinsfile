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

        stage('Run API Tests') {

            steps {
                script {
                    def IMAGE = "zynor-api-ci:${env.BUILD_NUMBER}"
                    def CONTAINER = "zynor-api-tests-${env.BUILD_NUMBER}"
                    // Reuse the same env file credential you already use for the health check
                    withCredentials([file(credentialsId: 'zynor-api-env-file', variable: 'API_ENV_FILE')]) {
                        sh """
                          echo "Running API tests in container..."
                          docker run --rm --name ${CONTAINER} \\
                            --env-file $API_ENV_FILE \\
                            ${IMAGE} \\
                            sh -c "pip install pytest && pytest apps/api/tests -q"
                        """
                    }
                }
            }
        }
    }
}





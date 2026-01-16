pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        BACKEND_IMAGE = 'taitai159/nmcnpm-backend'
        FRONTEND_IMAGE = 'taitai159/nmcnpm-frontend'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('Backend') {
                            echo 'Installing backend dependencies...'
                            bat 'npm install'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('Frontend') {
                            echo 'Installing frontend dependencies...'
                            bat 'npm install'
                        }
                    }
                }
            }
        }
        
        stage('Lint & Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('Backend') {
                            echo 'Running backend tests...'
                            bat 'npm test || exit 0'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('Frontend') {
                            echo 'Running frontend tests...'
                            bat 'npm test || exit 0'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('Backend') {
                            echo 'Building backend Docker image...'
                            bat "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('Frontend') {
                            echo 'Building frontend Docker image...'
                            bat "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                        }
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                script {
                   docker.withRegistry("https://${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS_ID}") {
                echo 'Pushing images using Plugin methods...'
                
                // Đẩy Backend
                def backend = docker.image("${BACKEND_IMAGE}:${IMAGE_TAG}")
                backend.push()
                backend.push('latest')

                // Đẩy Frontend
                def frontend = docker.image("${FRONTEND_IMAGE}:${IMAGE_TAG}")
                frontend.push()
                frontend.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying application...'
                bat 'docker-compose down || exit 0'
                bat 'docker-compose up -d'
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}

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
        
        stage('Docker Login') {
            when {
                branch 'main'
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", 
                                                     usernameVariable: 'DOCKER_USER', 
                                                     passwordVariable: 'DOCKER_PASS')]) {
                        echo 'Logging into Docker Hub...'
                        bat "echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin"
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                echo 'Pushing backend images...'
                bat "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                bat "docker push ${BACKEND_IMAGE}:latest"
                
                echo 'Pushing frontend images...'
                bat "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                bat "docker push ${FRONTEND_IMAGE}:latest"
            }
        }
        
        stage('Prepare Env File') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Creating .env.ci for docker-compose...'
                    def envContent = """
MYSQL_ROOT_PASSWORD=${env.MYSQL_ROOT_PASSWORD ?: 'rootpass123!'}
MYSQL_DATABASE=${env.MYSQL_DATABASE ?: 'se104'}
JWT_SECRET=${env.JWT_SECRET ?: 'changeme-jwt'}
JWT_EXPIRES_IN=${env.JWT_EXPIRES_IN ?: '1h'}
NODEMAILER_USER=${env.NODEMAILER_USER ?: ''}
NODEMAILER_PASSWORD=${env.NODEMAILER_PASSWORD ?: ''}
WEBSITE_URL=${env.WEBSITE_URL ?: 'https://se104.software/'}
SUPPORT_EMAIL=${env.SUPPORT_EMAIL ?: 'support@example.com'}
SUPPORT_PHONE=${env.SUPPORT_PHONE ?: '123-456-7890'}
TZ=Asia/Ho_Chi_Minh
"""
                    writeFile file: '.env.ci', text: envContent.trim() + "\n"
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying application...'
                bat 'docker-compose --env-file .env.ci down || exit 0'
                bat 'docker-compose --env-file .env.ci up -d'
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

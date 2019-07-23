pipeline {
  agent {
    docker {
      image 'node:12'
    }

  }
  stages {
    stage('test') {
      
      steps {
        script {
          docker.image('mongo:4').withRun('--name mongo')
          docker.image('redis:5').withRun('--name redis')
        }
        sh 'node --version'
      }
    }
  }
}

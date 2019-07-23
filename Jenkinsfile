pipeline {
  agent {
    docker {
      image 'node:12'
    }

  }
  stages {
    stage('test') {
      steps {
        sh 'node --version'
      }
    }
  }
}
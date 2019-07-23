pipeline {
  agent {
    docker {
      image 'node:12'
    }

  }
  stages {
    stage('test') {
      agent any
      steps {
        sh 'node -version'
      }
    }
  }
}
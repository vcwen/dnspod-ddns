pipeline {
  agent any
  stages {
    stage('test') {
      agent {
        node {
          label 'test'
        }

      }
      steps {
        sh 'node -version'
      }
    }
  }
}
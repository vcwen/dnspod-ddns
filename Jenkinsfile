pipeline {
  agent {
    docker { image 'node:12' }
  }
  stages {
    stage('test') {
      agent {
        node {
          label 'test'
          docker.image('mongo:4').withRun('--name mongo -p 27017:27017')
          docker.image('redis:5').withRun('--name redis -p 6379:6379')
        }

      }
      steps {
        sh 'node -version'
      }
    }
  }
}

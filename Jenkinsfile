pipeline {
  agent {
    docker {
      image 'node:12'
    }

  }
  stages {
    node {
      docker.image('mongo:4').withRun('--name mongo')
      docker.image('redis:5').withRun('--name redis')
    }
    stage('test') {
      steps {
        sh 'node --version'
      }
    }
  }
}

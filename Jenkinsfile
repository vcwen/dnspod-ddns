pipeline {
  agent {
    docker { image 'node:12' }
  }
  stages {
    stage('test') {
      agent {
        docker.image('mongo:4').withRun('--name mongo -p 27017:27017')
      }
      steps {
        sh 'node -version'
      }
    }
  }
}

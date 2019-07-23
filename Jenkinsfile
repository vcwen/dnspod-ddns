node {
  docker.image('mongo:4').withRun('--name mongo')
  docker.image('redis:5').withRun('--name redis')
  docker.image('node:12).inside {
               stage('test) {
                 sh 'node --version'
                     }
  }
}

node {
  docker.image('mongo:4').withRun('--name mongo') { c ->
    echo $(c.name)
  }
  docker.image('redis:5').withRun('--name redis') { c -> 
     echo $(c.name)
  }
  docker.image('node:12').inside {
    stage('test) {
      sh 'node --version'
   }
  }
}

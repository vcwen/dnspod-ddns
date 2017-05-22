const fork = require('child_process').fork

const path = require('path')
const worker = fork(path.resolve(__dirname, './s'), [JSON.stringify({name: 'vc'})], {
  env: {
    worker: true,
  },
})

worker.send({name: '111'})

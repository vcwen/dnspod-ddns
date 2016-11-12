/* eslint-disable no-console */
const fork = require('child_process').fork
const axon = require('axon')
const sock = axon.socket('rep')
const daemonSock = axon.socket('rep')
const constants = require('./constants')
const path = require('path')
const MINUTE = 60 * 1000

let worker = null
let stopped = false
const RESTART_INTERVAL = [1, 2, 3, 5, 8]
let restarts = 0

const state = Object.assign({status: 'inactive'}, JSON.parse(process.argv[2]))

daemonSock.bind(constants.SOCKET_PORT - 1)

sock.bind(constants.SOCKET_PORT)
sock.on('message', function (task, reply) {
  switch (task) {
    case 'stop':
      {
        stopped = true
        if(worker) {
          worker.send('stop')
        }
        console.log('DDNS stopped.')
        reply && reply()
        process.exit()
        break
      }
    case 'status':
      {
        reply(state)
        break
      }
  }
})

start()

function start() {
  if (worker) {
    return
  }
  stopped = false
  worker = fork(path.resolve(__dirname, './worker'), [process.argv[2]], {
    env: {
      worker: true,
    },
  })
  worker.on('exit', (code) => {
    console.log('worker exit')
    worker = null
    if (!stopped && code !== 0) {
      console.log('start a new worker process.')
      setTimeout(() => {
        start()
      }, RESTART_INTERVAL[restarts % RESTART_INTERVAL.length] * MINUTE)

    }
  })

  worker.on('message', (s) => {
    Object.assign(state, s)

  })
  console.log('DDNS Started.')
}





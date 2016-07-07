/* eslint-disable no-console */
const fork = require('child_process').fork
const axon = require('axon')
const sock = axon.socket('rep')
const daemonSock = axon.socket('rep')
const constants = require('./constants')
const path = require('path')
const TEN_MINTUES = 10 * 60 * 1000

let worker = null
let stopped = false
let restarts = []

function isRestartTooFrequently() {
  if (restarts.length < 10) {
    return false
  } else {
    restarts = restarts.filter((millis) => {
      return millis - Date.now() < TEN_MINTUES
    })
    if (restarts.length > 10) {
      return true
    } else {
      false
    }
  }

}


daemonSock.bind(constants.SOCKET_PORT - 1)

sock.bind(constants.SOCKET_PORT)
sock.on('message', function (task, reply) {
  switch (task) {
    case 'stop':
      {
        stopped = true
        worker.send('stop')
        console.log('DDNS stopped.')
        reply && reply()
        process.exit()
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
    if (isRestartTooFrequently) {
      console.log('Worker restart too frequently, DDNS will exit immediately, check out if any settings is not correct.')
      process.exit(1)
    }
    if (!stopped && code !== 0) {
      console.log('start a new worker process.')
      start()
    }
  })
  console.log('DDNS Started.')
}





/* eslint-disable no-console */
const fork = require('child_process').fork
const axon = require('axon')
const sock = axon.socket('rep')
const daemonSock = axon.socket('rep')
const constants = require('./constants')
const path = require('path')
const MINUTE = 60 * 1000

const workers = new Map()
let stopped = false
const RESTART_INTERVAL = [1, 2, 3, 5, 8]
let restarts = 0


const options = JSON.parse(process.argv[2])

const state = Object.assign({
  status: 'inactive',
}, options)

daemonSock.bind(constants.SOCKET_PORT - 1)

sock.bind(constants.SOCKET_PORT)
sock.on('message', function(task, id, reply = () => {}) {
  let worker = workers.get(id)
  switch (task) {
    case 'stop':
      {
        stopped = true
        if (worker) {
          worker.send('stop')
          reply()
        } else {
          reply(new Error('No such a task with Id:' + id))
        }
        break
      }
    case 'status':
      {
        reply(state)
        break
      }
  }
})


function start(options) {

  const domainName = options.subDomain + '.' + options.domain
  if (isWokerExisting(domainName)) {
    console.log('Domain name already exists.')
    return
  }
  stopped = false
  const id = generateId()
  const worker = fork(path.resolve(__dirname, './worker'), [process.argv[2]], {
    env: {
      worker: true,
    },
  })
  worker.on('exit', (code) => {
    console.log('worker exit')
    workers.set(id, null)
    if (!stopped && code !== 0) {
      console.log('start a new worker process.')
      setTimeout(() => {
        start()
      }, RESTART_INTERVAL[restarts % RESTART_INTERVAL.length] * MINUTE)
    }
  })
  worker.on('message', (s) => {
    const state = Object.assign({}, s)
  })
  const runner = new TaskRunner(id, domainName, worker)

  workers.set(id, runner)
  console.log('Woker Started.')
}


class TaskRunner {
  constructor(id, domainName, worker) {
    this.id = id
    this.domainName = domainName
    this.worker = worker
  }
}

let idCounter = 0

function generateId() {
  return idCounter++
}

function isWokerExisting(domainName) {
  return Array.from(workers.values()).some((t) => {
    return t.domainNme === domainName
  })
}

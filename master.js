/* eslint-disable no-console */
const fork = require('child_process').fork
const axon = require('axon')
const sock = axon.socket('rep')
const daemonSock = axon.socket('rep')
const constants = require('./constants')
const path = require('path')
const MINUTE = 60 * 1000

const runners = new Map()
const RESTART_INTERVAL = [1, 2, 3, 5, 8]
let restarts = 0

daemonSock.bind(constants.SOCKET_PORT - 1)

sock.bind(constants.SOCKET_PORT)
sock.on('message', function (event, reply = () => {}) {

  switch (event.action) {
    case 'start':
      startWorker(event.options)
      reply()
      break
    case 'stop':
      {
        const id = event.id
        const runner = runners.get(id)
        const worker = runner ? runner.worker : null
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
        const id = event.id
        const runner = runners.get(id)
        if (runner) {
          reply(runner.status)
        } else {
          reply(new Error('No such a task with Id:' + id))
        }
        break
      }
    case 'list':
      {
        const list = Array.from(runners.values()).map((item) => {
          return {
            id: item.id,
            domainName: item.domainName,
            status: item.status,
          }
        })
        reply(list)
      }
  }
})


function startWorker(options) {

  const domainName = options.subDomain + '.' + options.domainName
  if (isTaskExisting(domainName)) {
    console.log('Domain name already exists.')
    return
  }
  const id = generateId()
  const worker = fork(path.resolve(__dirname, './worker'), [JSON.stringify(options)], {
    env: {
      worker: true,
    },
  })
  worker.on('exit', (code) => {
    console.log('worker exit')
    runners.delete(id)
    const interval = RESTART_INTERVAL[restarts % RESTART_INTERVAL.length] * MINUTE
    if (code !== 0) {
      console.log(`Restart a new worker process of ${domainName} in ${interval} minutes.`)
      setTimeout(() => {
        startWorker(options)
      }, interval)
    }
  })
  worker.on('message', (state) => {
    Object.assign(runners.get(id).status, state)
  })
  const runner = new TaskRunner(id, domainName, options, worker)
  runners.set(id, runner)
  console.log('Woker Started.')
}


class TaskRunner {
  constructor(id, domainName, options, worker) {
    this.id = id
    this.domainName = domainName
    this.worker = worker
    this.options = options
    this.status = Object.assign({
      status: 'inactive',
    }, options)
  }
}

let idCounter = 0

function generateId() {
  return idCounter++
}

function isTaskExisting(domainName) {
  return Array.from(runners.values()).some((t) => {
    return t.domainName === domainName
  })
}

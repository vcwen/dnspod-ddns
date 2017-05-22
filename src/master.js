/* eslint-disable no-console */
const fork = require('child_process').fork
const axon = require('axon')
const sock = axon.socket('rep')
const daemonSock = axon.socket('rep')
const constants = require('./constants')
const path = require('path')
const Task = require('./Task')
const MINUTE = 60 * 1000

const RESTART_INTERVAL = [1, 2, 3, 5, 8]
let restarts = 0
const taskPool = new Map()
let idCounter = 0



daemonSock.bind(constants.SOCKET_PORT - 1)
sock.bind(constants.SOCKET_PORT)
sock.on('message', function (event, reply) {
  switch (event.action) {
    case 'start': {
      idCounter += 1
      start(idCounter, event.options)
      reply()
      break
    }
    case 'stop':
      {
        if(taskPool.has(event.id)) {
          taskPool.get(event.id).worker.send('stop')
        }
        reply()
        break
      }
    case 'list':
      {
        const arr = []
        taskPool.forEach((v, k) => arr.push(Object.assign({id: k},v.state)))
        reply(arr)
        break
      }
  }
})



function start(id, options) {
  if (taskPool.has(id)) {
    console.log('Worker already started.')
    return
  }
  const worker = fork(path.resolve(__dirname, './worker'), [options], {
    env: {
      worker: true,
    },
  })
  const task = new Task(worker, {status: 'inactive'})
  worker.on('exit', (code) => {
    console.log(`Worker:${id} exits.`)
    taskPool.delete(id)
    if (code !== 0) {
      console.log('start a new worker process.')
      setTimeout(() => {
        start(id, options)
      }, RESTART_INTERVAL[restarts % RESTART_INTERVAL.length] * MINUTE)
    } else {
      if(taskPool.size === 0) {
        process.exit()
      }
    }
  })

  worker.on('message', (event) => {
    switch(event.action) {
      case 'state':
        Object.assign(taskPool.get(id).state, event.state)
        break
      default:
        throw new TypeError('Unknown event.')
    }
  })
  taskPool.set(id, task)
  console.log(`DDNS worker:${id} started.`)
}





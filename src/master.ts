/* tslint:disable no-console */
import axon from 'axon'
import { fork } from 'child_process'
import path from 'path'
import { SOCKET_PORT } from './constants'
import { IpMonitor } from './lib/IpMonitor'
import { Task } from './Task'
const sock = axon.socket('rep', {})
const daemonSock = axon.socket('rep', {})

const taskPool = new Map<string, Task>()
const ipMonitor = new IpMonitor()
ipMonitor.start(10000)

ipMonitor.on('change', (ip) => {
  taskPool.forEach((task) => {
    task.worker.send({ action: 'SYNC_DDNS', ip })
  })
})
daemonSock.bind(SOCKET_PORT - 1)
sock.bind(SOCKET_PORT)
sock.on('message', async (msg, reply) => {
  switch (msg.action) {
    case 'start': {
      console.log(msg)
      await start(msg.name, msg.domain, msg.subdomain, msg.loginToken)
      reply()
      break
    }
    case 'stop': {
      if (msg.id === 'all') {
        taskPool.forEach((task) => {
          if (task.worker) {
            task.worker.send('stop')
          }
        })
        taskPool.clear()
      } else {
        const tk = taskPool.get(msg.id)
        if (tk) {
          if (tk.worker) {
            tk.worker.send('stop')
          }
          taskPool.delete(msg.id)
        } else {
          console.error(`Worker[${msg.id}] doesn't exist.`)
        }
      }
      reply()
      break
    }
    case 'list': {
      const domains = [] as any
      taskPool.forEach((task) => domains.push([task.name, task.status, task.subdomain, task.domain, task.ip || '']))
      reply(domains)
      break
    }
  }
})

async function start(name: string, domain: string, subdomain: string, loginToken: string) {
  const id = [subdomain, domain].join('.')
  if (taskPool.has(id)) {
    console.log(`Worker[${id}] already started.`)
    return
  }
  const worker = fork(path.resolve(__dirname, './worker'), [], {
    env: {
      worker: true
    }
  })
  const task = new Task(name, domain, subdomain, loginToken, worker)
  worker.on('exit', (code) => {
    console.log(`Worker[${id}] exited.`)
    if (code !== 0) {
      console.error(`Worker[${id}] exited with unexpected code:${code}`)
    } else {
      taskPool.delete(id)
      if (taskPool.size === 0) {
        process.exit()
      }
    }
  })
  const ip = await ipMonitor.getIp()
  worker.send({ action: 'INIT', domain, subdomain, loginToken, ip })
  taskPool.set(id, task)
  console.log(`DDNS worker:${id} started.`)
}

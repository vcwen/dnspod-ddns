/* tslint:disable no-console */
import axon from 'axon'
import { fork } from 'child_process'
import path from 'path'
import { SOCKET_PORT } from './constants'
import { IpMonitor } from './lib/IpMonitor'
import { Task } from './Task'

class Master {
  private sock: any
  private taskPool: Map<string, Task>
  private ipMonitor: IpMonitor
  constructor() {
    this.sock = axon.socket('rep', {})
    this.sock.on('message', async (msg, reply) => {
      switch (msg.action) {
        case 'PING': {
          reply()
          break
        }
        case 'start': {
          await this._createWorker(msg.name, msg.domain, msg.subdomain, msg.loginToken)
          reply()
          break
        }
        case 'stop': {
          if (msg.name === 'all') {
            this.taskPool.forEach((task) => {
              if (task.worker) {
                task.worker.send('stop')
              }
            })
            this.taskPool.clear()
          } else {
            let task: Task | undefined
            for (const item of this.taskPool.values()) {
              if (item.name === msg.name) {
                task = item
              }
            }
            if (task) {
              if (task.worker) {
                task.worker.kill()
              }
              this.taskPool.delete(msg.name)
            } else {
              console.error(`Worker[${msg.name}] doesn't exist.`)
            }
          }
          reply()
          break
        }
        case 'list': {
          const domains = [] as any
          this.taskPool.forEach((task) =>
            domains.push([task.name, task.status, task.subdomain, task.domain, task.ip || ''])
          )
          reply(null, domains)
          break
        }
      }
    })

    this.ipMonitor = new IpMonitor()
    this.ipMonitor.on('change', (ip) => {
      this.taskPool.forEach((task) => {
        if (task.worker) {
          task.worker.send({ action: 'SYNC_DDNS', ip })
        }
      })
    })
    this.taskPool = new Map<string, Task>()
  }
  public start() {
    this.ipMonitor.start(10000)
    this.sock.bind(SOCKET_PORT)
  }
  private async _createWorker(name: string, domain: string, subdomain: string, loginToken: string) {
    if (this.taskPool.has(name)) {
      console.log(`Worker[${name}] already started.`)
      return
    }
    const worker = fork(path.resolve(__dirname, './worker'), [], {
      env: {
        worker: true
      }
    })
    const task = new Task(name, domain, subdomain, loginToken, worker)
    worker.on('exit', (code) => {
      console.log(`Worker[${name}] exited.`)
      if (code !== 0) {
        console.error(`Worker[${name}] exited with unexpected code:${code}`)
      } else {
        this.taskPool.delete(name)
        if (this.taskPool.size === 0) {
          process.exit()
        }
      }
    })
    const ip = await this.ipMonitor.getIp()
    console.info('send INIT message')

    worker.send({ action: 'INIT', domain, subdomain, loginToken, ip })
    this.taskPool.set(name, task)
    console.log(`DDNS worker:${name} started.`)
  }
}

const master = new Master()
master.start()

/* tslint:disable no-console */
import { IPC } from 'node-ipc'
import { DnsClient } from './lib/DnsClient'
import { DnsPodClient } from './lib/DnsPodClient'
import { IpMonitor } from './lib/IpMonitor'
import { getLogger } from './lib/util'

const logger = getLogger()
process.on('uncaughtException', (err) => {
  logger.error(err.message)
})

process.on('unhandledRejection', (err) => {
  logger.error(err.message)
})

class Worker {
  private dnsClientStore: Map<string, DnsClient> = new Map()
  private ipMonitor: IpMonitor
  constructor() {
    this.ipMonitor = new IpMonitor()
    const ipc = new IPC()
    ipc.config.appspace = 'ddns.'
    ipc.config.id = 'worker'
    ipc.serve(() => {
      ipc.server.on('message', (data, socket) => {
        try {
          const res = this._onMessage(data)
          ipc.server.emit(socket, 'message', res)
        } catch (err) {
          ipc.server.emit(socket, 'message', err.message)
        }
      })
    })
    ipc.server.start()
    this.ipMonitor.on('change', (ip) => {
      this._sync(ip)
    })
  }
  public start() {
    this.ipMonitor.start(10000)
  }
  private _onMessage(msg: any) {
    switch (msg.action) {
      case 'PING': {
        return 'PONG'
      }
      case 'start': {
        if (this.dnsClientStore.has(msg.name)) {
          throw new Error(`${msg.name} already exists.`)
        } else {
          const client = new DnsPodClient(msg.name, msg.subdomain, msg.domain, msg.loginToken)
          this.dnsClientStore.set(msg.name, client)
        }
        return 'SUCCESS'
      }
      case 'stop': {
        if (msg.name === 'all') {
          this.dnsClientStore.clear()
        } else {
          if (this.dnsClientStore.has(msg.name)) {
            this.dnsClientStore.delete(msg.name)
          } else {
            throw new Error(`${msg.name} doesn't exist.`)
          }
        }
        return 'SUCCESS'
      }
      case 'list': {
        const domains = [] as any
        for (const item of this.dnsClientStore.values()) {
          domains.push([item.name, item.status, item.subdomain, item.domain, item.ip || ''])
        }
        return domains
      }
    }
  }
  private async _sync(ip: string) {
    for (const item of this.dnsClientStore.values()) {
      try {
        await item.sync(ip)
      } catch (err) {
        console.error(err)
      }
    }
  }
}

const worker = new Worker()
worker.start()

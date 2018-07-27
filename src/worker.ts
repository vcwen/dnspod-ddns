/* tslint:disable no-console */
import axon from 'axon'
import { SOCKET_PORT } from './constants'
import { DnsClient } from './lib/DnsClient'
import { DnsPodClient } from './lib/DnsPodClient'
import { IpMonitor } from './lib/IpMonitor'
import { logger } from './lib/Logger'
process.on('uncaughtException', (err) => {
  logger.error(err.message)
})

process.on('unhandledRejection', (err) => {
  logger.error(err.message)
})

class Worker {
  private sock: any
  private dnsClientStore: Map<string, DnsClient> = new Map()
  private ipMonitor: IpMonitor
  constructor() {
    this.ipMonitor = new IpMonitor()
    this.sock = axon.socket('rep', {})
    this.sock.on('message', async (msg, reply) => {
      try {
        const res = await this._onMessage(msg)
        reply(null, res)
      } catch (err) {
        reply(err)
      }
    })
    this.ipMonitor.on('change', (ip) => {
      this._sync(ip)
    })
  }
  public start() {
    this.ipMonitor.start(10000)
    this.sock.bind(SOCKET_PORT)
  }
  private async _onMessage(msg: any) {
    switch (msg.action) {
      case 'PING': {
        return
      }
      case 'start': {
        const client = new DnsPodClient(msg.name, msg.subdomain, msg.domain, msg.loginToken)
        if (this.dnsClientStore.has(msg.name)) {
          console.error('exists.')
        } else {
          this.dnsClientStore.set(msg.name, client)
          const ip = await this.ipMonitor.getIp()
          if (ip) {
            client.sync(ip)
          }
        }
        return
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
        return
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

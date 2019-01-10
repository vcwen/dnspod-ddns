/* tslint:disable no-console */
import { ClientStatus } from '../constants/ClientStatus'
import { DnsClient } from './DnsClient'
import { DnsPodClient } from './DnsPodClient'

export class Worker {
  private dnsClientStore: Map<string, DnsClient> = new Map()
  public onMessage(msg: any) {
    switch (msg.action) {
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
        const domains = [] as any[]
        for (const item of this.dnsClientStore.values()) {
          domains.push([item.name, item.status, item.subdomain, item.domain, item.ip || ''])
        }
        return domains
      }
    }
  }
  public async sync(ip: string) {
    for (const item of this.dnsClientStore.values()) {
      try {
        await item.sync(ip)
      } catch (err) {
        console.error(err)
      }
    }
  }
  public getActiveDomainCount() {
    let count = 0
    for (const client of this.dnsClientStore.values()) {
      if (client.status !== ClientStatus.STOPPED) {
        count += 1
      }
    }
    return count
  }
}

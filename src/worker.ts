import Debug from 'debug'
import { DnsClient } from './lib/DnsClient'
import { DnsPodClient } from './lib/DnsPodClient'
import { logger } from './lib/Logger'
const debug = Debug('ddnsman:Worker')
logger.info('DDNS worker started')

class Worker {
  private domain: string
  private subdomain: string
  private dnsClient: DnsClient
  constructor(domain: string, subdomain: string, accessToken: string) {
    this.domain = domain
    this.subdomain = subdomain
    this.dnsClient = new DnsPodClient(accessToken)
  }
  public async syncDdns(ip: string) {
    let status: string = ''
    try {
      await this.dnsClient.sync(this.domain, this.subdomain, ip)
      status = 'sync'
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error(err)
      status = 'error'
    } finally {
      const event = {
        action: 'STATUS',
        status,
        ip
      }
      if (process.send) {
        process.send(event)
      }
    }
  }
}

process.on('message', async (msg: any) => {
  debug('receive msg: %o', msg)
  let worker: Worker | undefined
  switch (msg.action) {
    case 'INIT':
      worker = new Worker(msg.domain, msg.subdomain, msg.loginToken)
      if (msg.ip) {
        worker.syncDdns(msg.ip)
      }
      break
    case 'SYNC_DDNS':
      if (worker) {
        await worker.syncDdns(msg.ip)
      }
      break
    case 'STOP':
      logger.info(`DDNS worker[${process.pid}] exits.`)
      process.exit(0)
      break
  }
})

import { DnsPodClient } from './lib/DnsPodClient'
import { logger } from './lib/Logger'
const options = {} as any
let dnsPodClient

logger.info('DDNS worker started')

const syncDdns = async (ip: string) => {
  let status: string = 'inactive'
  try {
    await dnsPodClient.syncDdns(options.domain, options.subdomain, ip)
    status = 'sync'
  } catch (err) {
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

process.on('message', async (msg: any) => {
  switch (msg.action) {
    case 'INIT':
      options.domain = msg.domain
      options.subdomain = msg.subdomain
      dnsPodClient = new DnsPodClient(msg.loginToken)
      await syncDdns(msg.ip)
      break
    case 'SYNC_DDNS':
      await syncDdns(msg.ip)
      break
    case 'STOP':
      logger.info(`DDNS worker[${process.pid}] exits.`)
      process.exit(0)
      break
  }
})

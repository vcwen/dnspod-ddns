import { EventEmitter } from 'events'
import { getPublicIP, logger } from './util'

export class IpMonitor extends EventEmitter {
  private timer: NodeJS.Timer
  private ip: string
  public async getIp() {
    if (this.ip) {
      return this.ip
    } else {
      try {
        const ip = await getPublicIP()
        this.ip = ip
        return ip
      } catch (err) {
        // tslint:disable-next-line:no-console
        console.error(err)
      }
    }
  }
  public async checkIp() {
    try {
      const ip = await getPublicIP()
      if (this.ip !== ip) {
        this.ip = ip
        this.emit('change', ip)
      }
    } catch (err) {
      logger.error('Failed to get external IP: %o' + err)
      // tslint:disable-next-line:no-console
      console.error(err)
    }
  }
  // default interval 10s
  public start(interval: number = 10000) {
    this.timer = setInterval(() => {
      this.checkIp()
    }, interval)
  }
  public stop() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}

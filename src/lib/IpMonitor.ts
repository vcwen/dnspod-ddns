import Debug from 'debug'
import { EventEmitter } from 'events'
import { Util } from './util';
const debug = Debug('IpMonitor')

export class IpMonitor extends EventEmitter {
  private timer: NodeJS.Timer
  private ip: string
  public async getIp() {
    if (this.ip) {
      return this.ip
    } else {
      try {
        const ip = await Util.getPublicIP()
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
      const ip = await Util.getPublicIP()
      if (this.ip !== ip) {
        this.ip = ip
        this.emit('change', ip)
      }
    } catch (err) {
      debug('Failed to get external IP: %o' + err)
      // tslint:disable-next-line:no-console
      console.error(err)
    }
  }
  public start(interval: number) {
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

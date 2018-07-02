import { EventEmitter } from 'events'
import { DnsPodClient } from './DnsPodClient'

export class IpMonitor extends EventEmitter {
  private timer: NodeJS.Timer
  private ip: string
  public async getIp() {
    if (this.ip) {
      return this.ip
    } else {
      const ip = await DnsPodClient.getPublicIP()
      this.ip = ip
      return ip
    }
  }
  public async checkIp() {
    const ip = await DnsPodClient.getPublicIP()
    if (this.ip !== ip) {
      this.ip = ip
      this.emit('change', ip)
    }
  }
  public start(interval: number) {
    this.timer = setInterval(() => {
      this.checkIp()
    }, interval)
  }
  public stop() {
    clearInterval(this.timer)
  }
}

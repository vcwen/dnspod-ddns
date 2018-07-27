/* tslint:disable no-console */
import axon from 'axon'
import { fork } from 'child_process'
import Table from 'cli-table'
import path from 'path'
import { SOCKET_PORT } from './constants'
export class CommandExec {
  private sock: any
  constructor() {
    this.sock = axon.socket('req', {})
    this.sock.connect(SOCKET_PORT)
  }
  public async start(subdomain: string, domain: string, loginToken: string, name?: string) {
    return this._run(async () => {
      if (!loginToken) {
        return console.error('Loin Token is required.')
      }
      if (!domain || !subdomain) {
        return console.error('Domain and sub domain are required.')
      }
      const started = await this._ping()
      if (!started) {
        fork(path.resolve(__dirname, './worker'))
      }
      name = typeof name === 'string' ? name : [subdomain, domain].join('.')
      await this._sendMessage({
        action: 'start',
        name,
        domain,
        subdomain,
        loginToken
      })
      console.log(`DDNS worker for ${name} started.`)
    }, false)
  }
  public async stop(name: string) {
    return this._run(async () => {
      if (!name) {
        return console.error('Name is required.')
      }

      await this._sendMessage({
        action: 'stop',
        name
      })
      console.log(`DDNS ${name} client stopped.`)
    })
  }
  public async list() {
    return this._run(async () => {
      const domainList = await this._sendMessage({ action: 'list' })
      const table = new Table({
        head: ['Name', 'Status', 'Subdomain', 'Domain', 'IP']
      })
      domainList.forEach((item) => {
        table.push(item)
      })
      console.log(table.toString())
    })
  }
  private async _ping(timeout: number = 1000): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.sock.send({ action: 'PING' }, () => {
        resolve(true)
      })
      setTimeout(() => {
        resolve(false)
      }, timeout)
    })
  }
  private async _sendMessage(msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sock.send(msg, (err, ...res: any[]) => {
        if (err) {
          reject(err)
        } else {
          if (res.length === 0) {
            resolve()
          } else if (res.length === 1) {
            resolve(res[0])
          } else {
            resolve(res)
          }
        }
      })
    })
  }
  private async _run(command: () => Promise<void>, requireWorkerStarted: boolean = true) {
    try {
      if (requireWorkerStarted && !(await this._ping())) {
        console.log('No ddns instance is running.')
      } else {
        await command()
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : err)
    } finally {
      process.exit()
    }
  }
}

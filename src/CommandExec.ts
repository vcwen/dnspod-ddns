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
  public async start({ name, subdomain, domainName, loginToken }) {
    this._run(async () => {
      if (!loginToken) {
        console.log('Loin Token is required.')
      }
      if (!domainName || !subdomain) {
        console.error('Domain and sub domain are required.')
      }
      const started = await this._ping()
      if (!started) {
        fork(path.resolve(__dirname, './master'))
      }
      name = name || [subdomain, domainName].join('.')

      await this._sendMessage({
        action: 'start',
        name,
        domain: domainName,
        subdomain,
        loginToken
      })
      console.log(`DDNS worker for ${name} started.`)
    })
  }
  public async stop(name: string) {
    let exitCode = 0
    try {
      if (!name) {
        return console.log('Name is required.')
      }
      await this._sendMessage({
        action: 'stop',
        name
      })
      console.log('DDNS client stopped.')
    } catch (err) {
      exitCode = -1
      console.error(err)
    } finally {
      process.exit(exitCode)
    }
  }
  public async list() {
    let exitCode = 0
    try {
      const started = await this._ping()
      if (!started) {
        console.log('No ddns instance is running.')
      } else {
        const domainList = await this._sendMessage({ action: 'list' })
        const table = new Table({
          head: ['Name', 'Status', 'Subdomain', 'Domain', 'IP']
        })
        domainList.forEach((item) => {
          table.push(item)
        })
        console.log(table.toString())
      }
    } catch (err) {
      console.error(err)
      exitCode = -1
      console.log('No ddns instance is running.')
    } finally {
      process.exit(exitCode)
    }
  }
  private async _ping(timeout: number = 1000): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.sock.send({ action: 'PING' }, () => {
        console.log('ok>>>>>')
        resolve(true)
      })
      setTimeout(() => {
        console.log('timeout>>>>')
        resolve(false)
      }, timeout)
    })
  }
  private async _sendMessage(msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('send>>>>>')
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
  private async _run(command: () => Promise<void>) {
    let exitCode = 0
    try {
      await command()
    } catch (err) {
      console.error(err)
      exitCode = -1
    } finally {
      process.exit(exitCode)
    }
  }
}

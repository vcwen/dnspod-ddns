/* tslint:disable no-console */
import { rejects } from 'assert'
import { fork } from 'child_process'
import Table from 'cli-table'
import { EventEmitter } from 'events'
import { IPC } from 'node-ipc'
import path from 'path'

export class CommandExec extends EventEmitter {
  private _ipc: any
  private _pingIpc: any
  private _isWorkerConnected: boolean = false
  constructor() {
    super()
    const ipc = new IPC()
    ipc.config.appspace = 'ddns.'
    ipc.config.id = 'client'
    this._ipc = ipc

    const pingIpc = new IPC()
    pingIpc.config.appspace = 'ddns.'
    pingIpc.config.id = 'pingClient'
    pingIpc.config.stopRetrying = true
    this._pingIpc = pingIpc
  }
  public async start(subdomain: string, domain: string, loginToken: string, name?: string) {
    if (!loginToken) {
      throw new Error('Loin Token is required.')
    }
    if (!domain || !subdomain) {
      throw new Error('Domain and sub domain are required.')
    }
    const started = await this._ping()
    if (!started) {
      fork(path.resolve(__dirname, './worker'))
    }
    return this._run(async () => {
      name = typeof name === 'string' ? name : [subdomain, domain].join('.')
      await this._sendMessage({
        action: 'start',
        name,
        domain,
        subdomain,
        loginToken
      })
      console.log(`DDNS worker for ${name} started.`)
    })
  }
  public async stop(name: string) {
    if (!name) {
      throw new Error('Name is required.')
    }
    return this._run(async () => {
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
  private async _ping(): Promise<boolean> {
    if (this._isWorkerConnected) {
      return true
    } else {
      return new Promise<boolean>((resolve) => {
        const ipc = this._pingIpc
        ipc.connectTo('worker', () => {
          ipc.of.worker.on('connect', () => {
            resolve(true)
            ipc.disconnect('worker')
          })
          ipc.of.worker.on('error', () => {
            resolve(false)
          })
        })
      })
    }
  }
  private async _sendMessage(msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this._ipc.of.worker.emit('message', msg)
      this._ipc.of.worker
        .on('message', (data) => {
          resolve(data)
        })
        .on('error', (err) => {
          reject(err)
        })
    })
  }
  private async _run(command: (...args: any[]) => Promise<void>) {
    return new Promise<void>((resolve, reject) => {
      this._ipc.connectTo('worker', () => {
        this._ipc.of.worker.on('connect', () => {
          command()
            .then(() => {
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
      })
    })
  }
}

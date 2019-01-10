/* tslint:disable no-console */
import Table from 'cli-table'
import { EventEmitter } from 'events'
import { sendMessage } from './lib/ipc'

export class CommandExec extends EventEmitter {
  constructor() {
    super()
  }
  public async start(subdomain: string, domain: string, loginToken: string, name?: string) {
    if (!loginToken) {
      throw new Error('Loin Token is required.')
    }
    if (!domain || !subdomain) {
      throw new Error('Domain and sub domain are required.')
    }

    this._runThenExit(async () => {
      name = typeof name === 'string' ? name : [subdomain, domain].join('.')
      await sendMessage({
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
    return this._runThenExit(async () => {
      await sendMessage({
        action: 'stop',
        name
      })
      console.log(`DDNS ${name} client stopped.`)
    })
  }
  public async list() {
    this._runThenExit(async () => {
      const domainList = await sendMessage({ action: 'list' })
      const table = new Table({
        head: ['Name', 'Status', 'Subdomain', 'Domain', 'IP']
      })
      domainList.forEach((item) => {
        table.push(item)
      })
      console.log(table.toString())
    })
  }

  private async _runThenExit(command: (...args: any[]) => Promise<void>) {
    command()
      .catch((err) => {
        console.error(err)
        process.exit(-1)
      })
      .finally(() => {
        process.exit(0)
      })
  }
}

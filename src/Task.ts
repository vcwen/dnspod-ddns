import { ChildProcess } from 'child_process'

export class Task {
  public name: string
  public domain: string
  public subdomain: string
  public loginToken: string
  public status: string = 'inactive'
  public ip: string
  public worker: ChildProcess
  constructor(name: string, domain: string, subdomain: string, loginToken: string, worker: ChildProcess) {
    this.name = name
    this.domain = domain
    this.subdomain = subdomain
    this.loginToken = loginToken
    this.worker = worker
    worker.on('message', (msg) => {
      switch (msg.action) {
        case 'STATUS':
          this.status = msg.status
          if (msg.status === 'sync') {
            this.ip = msg.ip
          }
          break
        default:
          // tslint:disable-next-line:no-console
          console.error('Unknown event.' + JSON.stringify(msg))
      }
    })
  }
}

import { ClientStatus } from '../constants/ClientStatus'

export interface IRecord {
  id: string
  value: string
  name: string
}

export abstract class DnsClient {
  public name: string
  public domain: string
  public subdomain: string
  public status: string = ClientStatus.INACTIVE
  constructor(name: string, subdomain: string, domain: string) {
    this.name = name
    this.subdomain = subdomain
    this.domain = domain
  }
  public abstract get ip(): string | undefined
  public abstract async sync(publicIp: string): Promise<IRecord>
}

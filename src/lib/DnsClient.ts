export interface IRecord {
  id: string
  value: string
  name: string
}

export abstract class DnsClient {
  public abstract async sync(domain: string, subdomain: string, publicip: string): Promise<IRecord>
}

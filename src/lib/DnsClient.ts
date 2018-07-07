export abstract class DnsClient {
  public abstract async sync(
    domain: string,
    subdomain: string,
    publicip: string
  ): Promise<{ id: string; name: string; value: string }>
}

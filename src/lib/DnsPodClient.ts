import Debug from 'debug'
import { request } from 'https'
import qs from 'querystring'
import { ApiUrl } from '../constants'
import { DnsClient, IRecord } from './DnsClient'

const debug = Debug('ddnsman:DnsPodClient')
const isResponseValid = (res) => {
  return res.status.code === '1'
}
export class DnsPodClient extends DnsClient {
  private loginToken: string
  private record?: IRecord
  constructor(name: string, subdomain: string, domain: string, loginToken: string) {
    super(name, subdomain, domain)
    this.loginToken = loginToken
  }
  public get ip() {
    return this.record ? this.record.value : undefined
  }
  public async getRecord() {
    debug('getRecord:' + this.domain)
    const opt = { domain: this.domain, sub_domain: this.subdomain }
    try {
      const res = await this._request(ApiUrl.record.list, opt)
      const records = res.records
      const record = records.find((item) => item.type === 'A' && item.name === this.subdomain)
      if (record) {
        return record as IRecord
      }
    } catch (err) {
      if (err.code === '10') {
        // code 10 means the record doesn't exist.
        return
      } else {
        throw err
      }
    }
  }
  public async createRecord(ip: string) {
    const opt = {
      sub_domain: this.subdomain,
      domain: this.domain,
      ttl: 600,
      record_type: 'A',
      record_line: '默认',
      value: ip
    }
    const res = await this._request(ApiUrl.record.create, opt)
    return res.record as IRecord
  }

  public async updateDdns(publicIp: string, recordId: string, recordLine: string = '默认') {
    const opt = {
      domain: this.domain,
      record_id: recordId,
      value: publicIp,
      sub_domain: this.subdomain,
      record_line: recordLine
    }
    const res = await this._request(ApiUrl.record.ddns, opt)
    this.status = 'sync'
    return res.record as IRecord
  }
  public async sync(ip: string) {
    const subdomain = this.subdomain
    const domain = this.domain
    debug('sync %s with %s', [subdomain, domain].join('.'), ip)
    if (!this.record) {
      this.record = await this.getRecord()
    }
    if (this.record) {
      if (this.record.value !== ip) {
        this.record = await this.updateDdns(ip, this.record.id)
      } else {
        this.status = 'sync'
      }
    } else {
      this.record = await this.createRecord(ip)
      this.record = await this.updateDdns(ip, this.record.id)
    }

    return this.record
  }
  private async _request(path: string, options: any) {
    return new Promise<any>((resolve, reject) => {
      const body = qs.stringify(Object.assign({ login_token: this.loginToken, format: 'json' }, options))
      const req = request(
        {
          method: 'POST',
          host: 'dnsapi.cn',
          path,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ddnsman/1.0.0 (wenwei1202@gmail.com)',
            Accept: 'application/json'
          }
        },
        (res) => {
          const data: Buffer[] = []
          res
            .on('data', (chunk) => {
              data.push(chunk)
            })
            .on('end', () => {
              const result = JSON.parse(Buffer.concat(data).toString())
              if (isResponseValid(result)) {
                resolve(result)
              } else {
                reject(result)
              }
            })
            .on('error', (err) => {
              reject(err)
            })
        }
      )
      req.on('error', (err) => {
        reject(err)
      })
      req.write(body)
      req.end()
    })
  }
}

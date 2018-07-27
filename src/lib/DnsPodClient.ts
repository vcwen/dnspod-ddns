import axios from 'axios'
import Debug from 'debug'

import qs from 'querystring'
import { ApiUrl } from '../constants'
import { DnsClient, IRecord } from './DnsClient'
const debug = Debug('ddnsman:DnsPodClient')
const validateResponse = (res) => {
  if (res.status.code !== '1') {
    throw Object.assign(new Error(), res.status)
  }
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
  private async _request(uri: string, options: any) {
    const data = qs.stringify(Object.assign({ login_token: this.loginToken, format: 'json' }, options))
    try {
      const res = await axios.post(uri, data, {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DDNS Client/1.0.0 (wenwei1202@gmail.com)'
        }
      })

      validateResponse(res.data)
      return res.data
    } catch (err) {
      debug('Request %s failed with data:[%s], reason: %o', uri, data, err)
      throw err
    }
  }
}

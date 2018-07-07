import axios from 'axios'
import Debug from 'debug'
import net from 'net'
import qs from 'querystring'
import { ApiUrl } from '../constants'
import { DnsClient } from './DnsClient'
const debug = Debug('ddnsman:DnsPodClient')
const validateResponse = (res) => {
  if (res.status.code !== '1') {
    throw Object.assign(new Error(), res.status)
  }
}

const isIPAddress = (str: string) => {
  str = str ? str.trim() : ''
  const regex = /^(\d+\.){3}\d+$/
  return regex.test(str)
}

export class DnsPodClient extends DnsClient {
  public static getPublicIP(): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = net
        .connect({
          host: 'ns1.dnspod.net',
          port: 6666
        })
        .on('data', (data) => {
          client.end()
          const ip = data.toString()
          if (isIPAddress(ip)) {
            resolve(ip)
          } else {
            reject(ip)
          }
        })
        .on('err', (err) => {
          reject(err)
        })
    })
  }
  private loginToken: string
  private record: { id: string; name: string; value: string }
  constructor(loginToken: string) {
    super()
    this.loginToken = loginToken
  }
  public async getRecordByName(domain: string, subdomain: string) {
    // debug('getRecordId:' + domainId)
    const opt = { domain, sub_domain: subdomain }
    const res = await this._request(ApiUrl.record.list, opt)
    const records = res.records
    const record = records.find((item) => item.type === 'A' && item.name === subdomain)
    if (record) {
      return record
    } else {
      throw new Error('No record found for sub domain:' + subdomain)
    }
  }

  public async updateDdns(publicIp: string, subdomain, domain, recordId, recordLine = '默认') {
    const opt = {
      domain,
      record_id: recordId,
      value: publicIp,
      sub_domain: subdomain,
      record_line: recordLine
    }
    const res = await this._request(ApiUrl.record.ddns, opt)
    return res.record as { id: string; value: string; name: string }
  }
  public async sync(domain: string, subdomain: string, publicIp: string) {
    debug('sync %s with %s', [subdomain, domain].join('.'), publicIp)
    if (!this.record) {
      this.record = await this.getRecordByName(domain, subdomain)
    }
    if (this.record) {
      if (this.record.value !== publicIp) {
        return await this.updateDdns(publicIp, subdomain, domain, this.record.id)
      }
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

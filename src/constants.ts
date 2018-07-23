import url from 'url'
export const SOCKET_PORT = 11235

const DNSPOD_API_URL = 'https://dnsapi.cn/'
export const ApiUrl = {
  domain: {
    info: url.resolve(DNSPOD_API_URL, 'domain.info')
  },
  record: {
    info: url.resolve(DNSPOD_API_URL, 'record.info'),
    list: url.resolve(DNSPOD_API_URL, 'record.list'),
    modify: url.resolve(DNSPOD_API_URL, 'record.modify'),
    ddns: url.resolve(DNSPOD_API_URL, 'record.ddns'),
    create: url.resolve(DNSPOD_API_URL, 'record.create')
  }
}

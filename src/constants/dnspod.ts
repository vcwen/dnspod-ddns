import url from 'url'

export const API_URL = 'https://dnsapi.cn/'
export const ApiUrl = {
  domain: {
    info: url.resolve('/', 'domain.info')
  },
  record: {
    info: url.resolve('/', 'record.info'),
    list: url.resolve('/', 'record.list'),
    modify: url.resolve('/', 'record.modify'),
    ddns: url.resolve('/', 'record.ddns'),
    create: url.resolve('/', 'record.create')
  }
}

import debug from 'debug'
import { connect, isIP } from 'net'

const info = debug('ddnsman:info')
const error = debug('ddnsman:error')

export const getPublicIP = async () => {
  return new Promise<string>((resolve, reject) => {
    const data: any[] = []
    connect({
      host: 'ns1.dnspod.net',
      port: 6666
    })
      .on('data', (chunk) => {
        data.push(chunk)
      })
      .on('end', () => {
        const ip = Buffer.concat(data).toString()
        if (isIP(ip)) {
          resolve(ip)
        } else {
          reject(new TypeError('Invalid IP address:' + ip))
        }
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

export const logger = {
  info,
  error
}

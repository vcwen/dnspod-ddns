import net from 'net'

const isIPAddress = (str: string) => {
  str = str ? str.trim() : ''
  const regex = /^(\d+\.){3}\d+$/
  return regex.test(str)
}
export class Util {
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
}

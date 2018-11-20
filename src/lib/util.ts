import mkdir from 'make-dir'
import { connect, isIP } from 'net'
import os from 'os'
import path from 'path'
import { createLogger, transports } from 'winston'

const appDir = path.resolve(os.homedir(), '.ddnsman')
const filePath = path.resolve(appDir, 'output.log')

mkdir.sync(appDir)
const logger = createLogger({
  level: 'info',
  transports: [
    new transports.File({
      filename: filePath,
      maxsize: 1000,
      maxFiles: 5
    })
  ]
})

export const getLogger = () => {
  return logger
}

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
          reject(ip)
        }
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

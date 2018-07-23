import mkdir from 'make-dir'
import os from 'os'
import path from 'path'
import winston from 'winston'
const appDir = path.resolve(os.homedir(), '.ddnsman')
const filePath = path.resolve(appDir, 'output.log')

mkdir.sync(appDir)
export const logger = new winston.Logger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: filePath
    })
  ]
})

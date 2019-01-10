import { IPC } from 'node-ipc'
import { IpMonitor } from './IpMonitor'
import { logger } from './util'
import { Worker } from './Worker'

process.on('uncaughtException', (err) => {
  logger.error(err.message)
})

process.on('unhandledRejection', (err) => {
  logger.error(err.message)
})

const worker = new Worker()
const ipMonitor: IpMonitor = new IpMonitor()
ipMonitor.on('change', (ip) => {
  worker.sync(ip)
})
const ipc = new IPC()
ipc.config.appspace = 'ddns.'
ipc.config.id = 'worker'
ipc.config.silent = true
ipc.serve(() => {
  ipc.server.on('message', (data, socket) => {
    try {
      const res = worker.onMessage(data)
      ipc.server.emit(socket, 'message', res)
    } catch (err) {
      ipc.server.emit(socket, 'message', err.message)
    } finally {
      if (worker.getActiveDomainCount() > 0) {
        ipMonitor.start()
      } else {
        ipMonitor.stop()
      }
    }
  })
})
ipc.server.start()

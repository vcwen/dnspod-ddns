import { IPC } from 'node-ipc'

export const pingDaemon = () => {
  const pingIpc = new IPC()
  pingIpc.config.appspace = 'ddns.'
  pingIpc.config.id = 'pingClient'
  pingIpc.config.maxRetries = 3 as any
  pingIpc.config.silent = true
  return new Promise<boolean>((resolve) => {
    pingIpc.connectTo('worker', () => {
      pingIpc.of.worker.on('connect', () => {
        resolve(true)
      })
      pingIpc.of.worker.on('error', () => {
        resolve(false)
      })
    })
  }).finally(() => {
    pingIpc.disconnect('worker')
  })
}

export const sendMessage = (msg: any): Promise<any> => {
  const ipc = new IPC()
  ipc.config.appspace = 'ddns.'
  ipc.config.id = 'client'
  ipc.config.silent = true
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Connecting to daemon timeout.'))
    }, 3000)
    ipc.connectTo('worker', () => {
      ipc.of.worker.on('connect', () => {
        ipc.of.worker.emit('message', msg)
        ipc.of.worker
          .on('message', (data) => {
            resolve(data)
          })
          .on('error', (err) => {
            reject(err)
          })
      })
    })
  }).finally(() => {
    ipc.disconnect('worker')
  })
}

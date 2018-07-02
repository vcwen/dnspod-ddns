/* tslint:disable no-console */
import axon from 'axon'
import { fork } from 'child_process'
import path from 'path'
import { SOCKET_PORT } from './constants'
const sock = axon.socket('req', {})
const daemonSock = axon.socket('req', {})

function pingDaemon(cb) {
  let called = false
  daemonSock.on('connect', () => {
    daemonSock.close()
    if (!called) {
      cb(true)
      called = true
    }
  })
  daemonSock.on('reconnect attempt', () => {
    daemonSock.close()
    if (!called) {
      cb(false)
      called = true
    }
  })
  daemonSock.connect(SOCKET_PORT - 1)
}

class Client {
  public start(options) {
    pingDaemon((started) => {
      if (!started) {
        fork(path.resolve(__dirname, './master'))
      }
      sock.on('connect', () => {
        console.log(options)
        sock.send(
          {
            action: 'start',
            name: options.name,
            domain: options.domain,
            subdomain: options.subdomain,
            loginToken: options.loginToken
          },
          () => {
            console.log('DDNS client started.')
            process.exit()
          }
        )
      })
      sock.connect(SOCKET_PORT)
    })
  }
  public stop(id: string | number) {
    pingDaemon((started) => {
      if (started) {
        sock.connect(SOCKET_PORT)
        sock.send(
          {
            action: 'stop',
            id
          },
          () => {
            console.log('DDNS client stopped.')
            process.exit()
          }
        )
      } else {
        console.log('No DDNS client instance is running.')
        process.exit()
      }
    })
  }
  public list(callback) {
    pingDaemon((started) => {
      console.log('>>>>>>list1')
      if (started) {
        console.log('>>>>>>list2')
        sock.connect(SOCKET_PORT)
        sock.send(
          {
            action: 'list'
          },
          (domains) => {
            callback(null, domains)
          }
        )
      } else {
        console.log('No ddns instance is running.')
        process.exit()
      }
    })
  }
}

export const client = new Client()

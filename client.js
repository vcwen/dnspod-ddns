/* eslint-disable no-console */
const axon = require('axon')
const sock = axon.socket('req')
const daemonSock = axon.socket('rep')
const fork = require('child_process').fork
const constants = require('./constants')
const path = require('path')


class Client {
  constructor() {
    this.startingMaster = false
  }
  start(options) {
    const self = this
    pingDaemon((started) => {
      if (started) {
        if (self.starting) return
        self.starting = true
        sock.connect(constants.SOCKET_PORT)
        const event = {
          action: 'start',
          options: options,
        }
        sock.send(event, () => {
          process.exit()
        })
      } else {
        fork(path.resolve(__dirname, './master'))
        setTimeout(() => {
          self.start(options)
        }, 1000)
      }
    })
  }
  stop(id) {
    pingDaemon((started) => {
      if (started) {
        sock.connect(constants.SOCKET_PORT)
        const event = {
          action: 'stop',
          id: Number.parseInt(id),
        }
        sock.send(event, () => {
          console.log('client stop')
        })
      } else {
        console.log('No ddns instance is running.')
        process.exit()
      }
    })
  }
  status(id, callback) {
    pingDaemon((started) => {
      if (started) {
        sock.connect(constants.SOCKET_PORT)
        const event = {
          action: 'status',
          id: Number.parseInt(id),
        }
        sock.send(event, (status) => {
          ['loginToken', 'pass'].forEach((key) => {
            Reflect.deleteProperty(status, key)
          })
          callback(null, status)
        })
      } else {
        console.log('No ddns instance is running.')
        process.exit()
      }
    })
  }
  list(callback) {
    sock.connect(constants.SOCKET_PORT)
    const event = {
      action: 'list',
    }
    sock.send(event, (list) => {
      callback(null, list)
    })
  }
}



function pingDaemon(cb) {
  daemonSock.on('connect', function () {
    daemonSock.close()
    cb(true)
  })
  daemonSock.on('reconnect attempt', function () {
    daemonSock.close()
    cb(false)
  })
  daemonSock.connect(constants.SOCKET_PORT - 1)
}


module.exports = new Client()

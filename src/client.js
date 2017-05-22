/* eslint-disable no-console */
const axon = require('axon')
const sock = axon.socket('req')
const daemonSock = axon.socket('req')
const fork = require('child_process').fork
const constants = require('./constants')
const path = require('path')

const client = {}


function pingDaemon(cb) {
  let called = false
  daemonSock.on('connect', function () {
    daemonSock.close()
    if (!called) {
      cb(true)
      called = true
    }
  })
  daemonSock.on('reconnect attempt', function () {
    daemonSock.close()
    if (!called) {
      cb(false)
      called = true
    }
  })
  daemonSock.connect(constants.SOCKET_PORT - 1)
}

client.start = function (options) {
  pingDaemon((started) => {
    if (!started) {
      fork(path.resolve(__dirname, './master'))
    }
    sock.on('connect', function () {
      sock.send({
        action: 'start',
        options: JSON.stringify(options),
      }, () => {
        console.log('DDNS client started.')
        process.exit()
      })
    })
    sock.connect(constants.SOCKET_PORT)
  })
}

client.stop = function (id) {
  pingDaemon((started) => {
    if (started) {
      sock.connect(constants.SOCKET_PORT)
      sock.send({
        action: 'stop',
        id,
      }, () => {
        console.log('DDNS client stopped.')
        process.exit()
      })
    } else {
      console.log('No ddns instance is running.')
      process.exit()
    }
  })
}

client.list = function (callback) {
  pingDaemon((started) => {
    if (started) {
      sock.connect(constants.SOCKET_PORT)
      sock.send({
        action: 'list',
      }, (stateList) => {
        const res = []
        stateList.forEach((state) => {
          ['loginToken', 'pass'].forEach((key) => {
            Reflect.deleteProperty(state, key)
          })
          res.push(state)
        })
        callback(null, res)
      })
    } else {
      console.log('No ddns instance is running.')
      process.exit()
    }
  })
}

module.exports = client

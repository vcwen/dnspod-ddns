/* eslint-disable no-console */
const axon = require('axon')
const sock = axon.socket('req')
const daemonSock = axon.socket('rep')
const fork = require('child_process').fork
const constants = require('./constants')
const path = require('path')

const client = {}


function pingDaemon(cb) {
  daemonSock.on('connect', function() {
    daemonSock.close()
    cb(true)
  })
  daemonSock.on('reconnect attempt', function() {
    sock.close()
    cb(false)
  })
  daemonSock.connect(constants.SOCKET_PORT - 1 )
}

client.start = function(options) {
  pingDaemon((started) => {
    if (started) {
      console.log('already started')
    } else {
      fork(path.resolve(__dirname, './master'), [JSON.stringify(options)])
      process.exit(0)
    }
  })
}

client.stop = function() {
  pingDaemon((started) => {
    if (started) {
      sock.connect(constants.SOCKET_PORT)
      sock.send('stop', () => {
        console.log('client stop')
        process.exit()
      })
    } else {
      console.log('No ddns instance is running.')
      process.exit()
    }
  })
}

module.exports = client

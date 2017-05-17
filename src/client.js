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

client.start = function (options) {
  pingDaemon((started) => {
    if(!started) {
      fork(path.resolve(__dirname, './master'))
    }
    sock.connect(constants.SOCKET_PORT)
    sock.send({ action: 'start', options: JSON.stringify(options)}, () => {
      console.log('DDNS client stopped.')
      process.exit()
    })
  })
}

client.stop = function(id) {
  pingDaemon((started) => {
    if (started) {
      sock.connect(constants.SOCKET_PORT)
      sock.send({action: 'stop', id}, id, () => {
        console.log('DDNS client stopped.')
        process.exit()
      })
    } else {
      console.log('No ddns instance is running.')
      process.exit()
    }
  })
}

client.status = function(id, callback) {
  pingDaemon((started) => {
    if (started) {
      sock.connect(constants.SOCKET_PORT)
      sock.send({action: 'status', id}, (status) => {
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

module.exports = client

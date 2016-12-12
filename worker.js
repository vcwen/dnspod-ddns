const logger = require('winston')
const os = require('os')
const fs = require('fs')
const path = require('path')
const Ddns = require('./ddns')
const mkdirp = require('mkdirp')
const options = JSON.parse(process.argv[2])

const state = {
  status: 'inactive',
}

configLogger()
start()


function configLogger() {

  const logfile = path.resolve(options.logDir, `${options.subDomain}.${options.domainName}.log`)
  fs.access(options.logDir, 'r', (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        mkdirp.sync(options.logDir)
      } else {
        throw err
      }
    }
    logger.add(logger.transports.File, {
      filename: logfile,
    })
  })
}

function start() {
  retrieveStoredIPAddress((err, ip) => {
    if (err) return logger.error(err)
    const ddns = new Ddns(options, ip)
    ddns.on('success', (ip) => {
      state.publicIp = ip
      state.status = 'active'
      process.send(state)
      persistIPAddress(ip)
    })

    ddns.on('failure', (err) => {
      state.errMsg = JSON.stringify(err)
      state.status = 'error'
      process.send(state)
    })

    const taskId = setInterval(function () {
      try {
        ddns.refresh()
      } catch (e) {
        logger.error(e)
        process.exit(1)
      }

    }, options.interval)

    logger.info('DDNS worker started')

    process.on('message', (task) => {
      switch (task) {
        case 'stop':
          clearInterval(taskId)
          logger.info('DDNS worker stopped.')
          process.exit(0)
      }
    })
    ddns.refresh()
  })
}



function persistIPAddress(ip) {
  const domainName = options.subDomain + '.' + options.domainName
  const tmpfile = path.resolve(os.tmpdir(), domainName)
  const info = {
    ip: ip,
    timestamp: Date().getTime(),
  }
  fs.writeFile(tmpfile, JSON.stringify(info), (err) => {
    if (err) logger.error(err)
  })
}

function retrieveStoredIPAddress(callback) {
  const domainName = options.subDomain + '.' + options.domainName
  const tmpfile = path.resolve(os.tmpdir(), domainName)
  fs.readFile(tmpfile, (err, data) => {
    if (data) {
      const info = JSON.parse(data)
      if (Date.now() - info.timestamp < 60 * 60 * 1000) {
        return callback(null, info.ip)
      }
    }
    callback()
  })
}

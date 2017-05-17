const winston = require('winston')
const path = require('path')
const Ddns = require('./ddns')
const mkdirp = require('mkdirp')
const options = JSON.parse(process.argv[2])
const logDir = path.dirname(options.logfile)

const state = Object.assign({status: 'inactive'}, JSON.parse(process.argv[2]))

mkdirp.sync(logDir)
const logger = new winston.Logger({
  level: 'info',
  transports: [
    new(winston.transports.Console)(),
    new(winston.transports.File)({
      filename: options.logfile,
    }),
  ],
})

const ddns = new Ddns(options)
ddns.on('success', (ip) => {
  state.publicIp = ip
  state.status = 'active'
  const event = {
    action: 'state',
    state,
  }
  process.send(event)
})

ddns.on('failure', (err) => {
  state.errMsg = JSON.stringify(err)
  state.status = 'error'
  process.send(state)
})

ddns.refresh()
const taskId = setInterval(function() {
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

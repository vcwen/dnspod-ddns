const Ddns = require('./ddns')
const options = JSON.parse(process.argv[2])
const ddns = new Ddns(options)
const winston = require('winston')
const logger = new winston.Logger({
  level: 'info',
  transports: [
    new(winston.transports.Console)(),
    new(winston.transports.File)({
      filename: '/var/log/ddns/ddns.log',
    }),
  ],
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
      {
        clearInterval(taskId)
        logger.info('DDNS worker stopped.')
        process.exit(0)
      }
  }
})

#!/usr/bin/env node

import { fork } from 'child_process'
import program from 'commander'
import nodepath from 'path'
import { CommandExec } from '../CommandExec'
import { pingDaemon } from '../lib/ipc'
import { logger } from '../lib/util'

// tslint:disable-next-line:no-var-requires
const pkg = require('../../package.json')
program.version(pkg.version)

pingDaemon().then((started) => {
  if (!started) {
    fork(nodepath.resolve(__dirname, '../lib/daemon'))
  }
})
program
  .command('start')
  .description('start DDNS')
  .option('--name <name>', 'Name')
  .option('-d --domainName <domain>', 'Domain *required')
  .option('-s --subdomain <subdomain>', 'Sub domain *required')
  .option('-t --login-token <token>', 'Login token, format:<Id,Token> *required')
  .action((options) => {
    logger.info('start with %o', options)
    const exec = new CommandExec()
    exec.start(options.subdomain, options.domainName, options.loginToken, options.name)
  })

program
  .command('stop <name>|all')
  .description('Stop DDNS with id')
  .action((name) => {
    logger.info('stop ' + name)
    const exec = new CommandExec()
    exec.stop(name)
  })

program
  .command('ls')
  .description('status of ddns')
  .action(() => {
    logger.info('list')
    const exec = new CommandExec()
    exec.list()
  })

program.parse(process.argv)

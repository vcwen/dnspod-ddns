#!/usr/bin/env node

import program from 'commander'
import Debug from 'debug'
import { CommandExec } from '../CommandExec'
program.version('0.0.5')
const debug = Debug('ddnsman')

const run = (command: Promise<void>) => {
  command
    .catch((err) => {
      // tslint:disable-next-line:no-console
      console.error(err.message)
    })
    .finally(() => {
      process.exit()
    })
}

program
  .command('start')
  .description('start DDNS')
  .option('--name <name>', 'Name')
  .option('-d --domainName <domain>', 'Domain *required')
  .option('-s --subdomain <subdomain>', 'Sub domain *required')
  .option('-t --login-token <token>', 'Login token, format:<Id,Token> *required')
  .option('--if --interface <interface>', 'Interface to get the public IP address')
  .option('-c --conf <filepath>', 'Config file(json format)')
  .action((options) => {
    debug('start with %o', options)
    const exec = new CommandExec()
    run(exec.start(options.subdomain, options.domainName, options.loginToken, options.name))
  })

program
  .command('stop <name>|all')
  .description('Stop DDNS with id')
  .action((name) => {
    debug('stop ' + name)
    const exec = new CommandExec()
    run(exec.stop(name))
  })

program
  .command('ls')
  .description('status of ddns')
  .action(() => {
    debug('list')
    const exec = new CommandExec()
    run(exec.list())
  })

program.parse(process.argv)

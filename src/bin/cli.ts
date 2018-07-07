#!/usr/bin/env node

import program from 'commander'
import Debug from 'debug'
import { CommandExec } from '../CommandExec'
program.version('0.0.5')
const debug = Debug('cli')
const exec = new CommandExec()

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
    exec.start(options)
  })

program
  .command('stop <name>|all')
  .description('Stop DDNS with id')
  .action((name) => {
    debug('stop ' + name)
    exec.stop(name)
  })

program
  .command('ls')
  .description('status of ddns')
  .action(() => {
    debug('list')
    exec.list()
  })
program.parse(process.argv)

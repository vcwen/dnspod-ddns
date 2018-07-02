#!/usr/bin/env node

import Table from 'cli-table'
import program from 'commander'
import path from 'path'
import { client } from '../client'
program.version('0.0.5')

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
    const opts = {} as any
    if (options.conf) {
      const filepath = path.resolve(process.cwd(), options.conf)
      Object.assign(opts, require(filepath))
      opts.conf = filepath
    } else {
      if (options.loginToken) {
        opts.loginToken = options.loginToken
      } else {
        // tslint:disable-next-line:no-console
        return console.log('Login Token is required.')
      }
    }
    opts.name = options.name || [options.subdomain, options.domainName].join('.')
    opts.domain = options.domainName
    opts.subdomain = options.subdomain
    if (!opts.domain || !opts.subdomain) {
      // tslint:disable-next-line:no-console
      return console.error('Domain and sub domain are required.')
    }
    client.start(opts)
  })

program
  .command('stop <id>|all')
  .description('Stop DDNS with id')
  .action((id) => {
    const regex = /\d+/
    if (!id) {
      // tslint:disable-next-line:no-console
      return console.log('Id is required.')
    }
    if (id.toLowerCase() === 'all') {
      client.stop(id.toLowerCase())
    } else if (regex.test(id)) {
      client.stop(Number.parseInt(id))
    } else {
      // tslint:disable-next-line:no-console
      return console.log(`Id:${id} is invalid.`)
    }
  })

program
  .command('ls')
  .description('status of ddns')
  .action(() => {
    const table = new Table({
      head: ['Name', 'Status', 'Subdomain', 'Domain', 'IP']
    })
    client.list((err, domains) => {
      if (err) {
        // tslint:disable-next-line:no-console
        return console.error(err)
      }
      domains.forEach((item) => {
        table.push(item)
      })
      // tslint:disable-next-line:no-console
      console.log(table.toString())
      process.exit(0)
    })
  })
program.parse(process.argv)

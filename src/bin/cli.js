#!/usr/bin/env node

/* eslint no-console: "off" */
const program = require('commander')
const path = require('path')
const Table = require('cli-table')
const version = require('../../package.json').version
const IpQueryUrl = 'http://members.3322.org/dyndns/getip'
const client = require('../client')
program
  .version(version)

program
  .command('start')
  .description('start DDNS')
  .action(function(options) {
    const opts = {}
    if (options.conf) {
      const filepath = path.resolve(process.cwd(), options.conf)
      Object.assign(opts, require(filepath))
      opts.conf = filepath
    } else {
      if (!options.loginToken) {
        if (options.email && options.pass) {
          opts.email = options.email
          opts.pass = options.pass
          console.warn('Login token is recommended,email/password is not a safe way.')
        } else {
          console.log('Login Token is required.')
          return
        }
      } else {
        opts.loginToken = options.loginToken
      }
    }

    opts.queryUrl = options.queryUrl || IpQueryUrl
    opts.interval = options.interval || 30000 // default 30 seconds
    opts.logfile = path.resolve(options.logfile || '/var/log/ddns/ddns.log')
    opts.domain = options.domain
    opts.subDomain = options.subDomain
    if (!opts.domain || !opts.subDomain) {
      console.error('Domain and sub domain are required.')
      return
    }
    client.start(opts)
  })
  .option('--name <name>', 'Name')
  .option('-d --domain <domain>', 'Domain *required')
  .option('-s --sub-domain <sub-domain>', 'Sub domain *required')
  .option('-t --login-token <token>', 'Login token, format:<Id,Token> *required')
  .option('--email <email>', 'Email')
  .option('--pass <pass>', 'Password')
  .option('--if --interface <interface>', 'Interface to get the public IP address')
  .option('-i --interval <interval>', 'Target IP address')
  .option('--query-url <url>', 'URL to query the public IP address')
  .option('-c --conf <filepath>', 'Config file(json format)')
  .option('-l --logfile <logfile>', 'Logfile path')

program
  .command('stop <id>')
  .description('Stop DDNS with id')
  .action(function(id) {
    client.stop(id)
  })

program
  .command('status <id>')
  .description('status of ddns')
  .action((id) => {
    const table = new Table()
    client.status(id, (err, status) => {
      Object.keys(status).forEach((key) => {
        if(key) {
          table.push({[key]: status[key]})
        }
      })
      console.log(table.toString())
      process.exit(0)
    })
  })

program.parse(process.argv)

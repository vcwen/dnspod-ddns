#!/usr/bin/env node

/* eslint no-console: "off" */
const program = require('commander')
const path = require('path')
const Table = require('cli-table')
const version = require('../package.json').version
const IpQueryUrl = 'http://members.3322.org/dyndns/getip'
const client = require('../client')
program
  .version(version)

program
  .command('start')
  .description('start DDNS')
  .action(function(params) {
    let options = {}
    if (params.conf) {
      const filepath = path.resolve(process.cwd(), params.conf)
      options = require(filepath)
      options.conf = filepath
    } else {
      options.domain = params.domain
      options.subDomain = params.subDomain
      if (params.loginToken) {
        options.loginToken = params.loginToken
      } else if (params.email && params.pass) {
        options.email = params.email
        options.pass = params.pass
        console.log('Login token is recommended,email/password is not a safe way.')
      } else {
        console.log('Login Token or emai/password is required.')
        return
      }
      options.subDomain = params.subDomain
      options.queryUrl = params.queryUrl
      options.interval = params.interval
      options.logfile = params.logfile
    }

    options.queryUrl = options.queryUrl || IpQueryUrl
    options.interval = options.interval || 30000 // default 30 seconds
    options.logfile = options.logfile || '/var/log/ddns/ddns.log'

    if (!options.domain || !options.subDomain) {
      console.log('Domain and sub domain are required.')
      return
    }
    client.start(options)
  })
  .option('-s --sub-domain <sub-domain>', 'Sub domain *required')
  .option('-t --login-token <token>', 'Login token *required')
  .option('--email <email>', 'Email')
  .option('--pass <pass>', 'Password')
  .option('--if --interface <interface>', 'Interface to get the public IP address')
  .option('-i --interval <interval>', 'Target IP address')
  .option('--query-url <url>', 'URL to query the public IP address')
  .option('-c --conf <filepath>', 'Config file(json format)')
  .option('-l --logfile <logfile>', 'Logfile path')

program
  .command('stop')
  .description('Stop DDNS')
  .action(function() {
    client.stop()
  })

program
  .command('status')
  .description('status of ddns')
  .action(() => {

    const table = new Table()
    client.status((err, status) => {
      Object.keys(status).forEach((key) => {
        if(key) {
          table.push({[key]: status[key]})
        }
      })
      process.exit(0)
    })



  })

program.parse(process.argv)

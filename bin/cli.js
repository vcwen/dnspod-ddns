#!/usr/bin/env node

/* eslint no-console: "off" */
const program = require('commander')
const path = require('path')
const os = require('os')
const Table = require('cli-table')
const version = require('../package.json').version
const IpQueryUrl = 'http://members.3322.org/dyndns/getip'
const client = require('../client')
program
  .version(version)

const defaultLogDir = path.resolve(os.homedir(), '.ddns')

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
      options.domainName = params.domainName
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
      options.logDir = params.logDir || defaultLogDir
    }

    options.queryUrl = options.queryUrl || IpQueryUrl
    options.interval = options.interval || 30000 // default 30 seconds
    options.logDir = options.logDir || defaultLogDir

    if (!options.domainName || !options.subDomain) {
      console.log('Domain and sub domain are required.')
      return
    }
    client.start(options)
  })
  .option('-d --domain-name <domain>', 'Domain *required')
  .option('-s --sub-domain <sub-domain>', 'Sub domain *required')
  .option('-t --login-token <token>', 'Login token *required')
  .option('--email <email>', 'Email')
  .option('--pass <pass>', 'Password')
  .option('--if --interface <interface>', 'Interface to get the public IP address')
  .option('-i --interval <interval>', 'Target IP address')
  .option('--query-url <url>', 'URL to query the public IP address')
  .option('-c --conf <filepath>', 'Config file(json format)')
  .option('-l --logDir <logDir>', 'LogDir path')

program
  .command('stop <id>')
  .description('Stop DDNS')
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

program
  .command('list')
  .description(' list of ddns')
  .action(() => {
    const table = new Table({head: ['Id', 'Domain Name', 'Status', 'IP Address', 'interval', 'logDir']})
    client.list((err, list) => {
      if(err) {
        console.error(err)
        process.exit(1)
      } else {
        console.log(JSON.stringify(list))
        list.forEach(item => {
          table.push([item.id,item.domainName,item.status.status , item.status.publicId || '', item.status.interval, item.status.logDir || ''])
        })
        console.log(table.toString())
        process.exit(0)
      }

    })
  })

program.parse(process.argv)

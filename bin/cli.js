/*eslint no-console: "allow"*/
const program = require('commander')
const version = require('../package.json').version
const IpQueryUrl = 'http://members.3322.org/dyndns/getip'
const client = require('../client')
const token = '12731,7c270a06f77f1f0bd17ca23ba06d9bb5'
program
  .version(version)
  .option('-d --domain-name <domain>', 'Domain *required')
  .option('-s --sub-domain <sub-domain>', 'Sub domain *required')
  .option('-t --login-token <token>', 'Login token *required')
  .option('--email <email>', 'Email')
  .option('--pass <pass>', 'Password')
  .option('--ip <ip>', 'Target IP address')
  .option('--if --interface <interface>', 'Interface to get the public IP address')
  .option('-i --interval <interval>', 'Target IP address')
  .option('--query-url <url>', 'URL to query the public IP address')
  .option('-c --config <filepath>', 'Config file(json format)')


program
  .command('start')
  .description('start DDNS')
  .action(function () {
    const options = {}
    console.log(program.domainName)
    options.domain = program.domainName
    options.subDomain = program.subDomain
    if (program.loginToken) {
      options.loginToken = program.loginToken
    } else if (program.email && program.pass) {
      options.email = program.email
      options.pass = program.pass
      console.log('Login token is recommended,email/password is not a safe way.')
    } else {
      console.log('Login Token or emai/password is required.')
      return
    }
    options.subDomain = program.subDomain
    options.ip = program.ip
    options.queryUrl = program.queryUrl || IpQueryUrl
    options.interval = program.interval || 5000 // default 5 seconds
    options.daemon = program.daemon || true

    if (!options.domain || !options.subDomain) {
      console.log('Domain and sub domain are required.')
      return
    }
    client.start(options)
  })

program
  .command('stop')
  .description('Stop DDNS')
  .action(function () {
    client.stop()
  })

program.parse(process.argv)

let counter = 5
console.log(process.argv[2])
setInterval(() => {
  console.log('slaving')
  if (counter-- == 0) process.exit()
}, 5000)

process.on('message', (msg) => {
  console.log(msg)
})

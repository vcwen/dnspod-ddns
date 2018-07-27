const axon = {
  socket() {
    return {
      connect() {
        // nothing
      },
      send(data, callback) {
        callback()
        // tslint:disable-next-line:no-console
        // console.log('send')
      }
    }
  }
}
module.exports = axon

const axon = {
  socket() {
    return {
      connect() {
        // nothing
      },
      send(data, callback) {
        if (this._sendHandler) {
          this._sendHandler(data, callback)
        }
        // tslint:disable-next-line:no-console
        // console.log('send')
      }
    }
  }
}
module.exports = axon

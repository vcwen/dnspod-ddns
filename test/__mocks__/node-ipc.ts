import { EventEmitter } from 'events'

// tslint:disable-next-line:only-arrow-functions

class IPC {
  public config: any = {}
  public of: any = {}
  public connectTo(server, callback) {
    this.of[server] = {
      emit(event: string, data: any) {
        console.log(event + data)
      },
      on(event: string, cb: any) {
        cb(event)
      }
    }
    setTimeout(() => {
      this.of[server].emit('connect')
    }, 100)
    callback()
  }
}
module.exports.IPC = IPC

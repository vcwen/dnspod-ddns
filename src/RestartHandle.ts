const MINUTE = 60 * 1000

const RESTART_INTERVAL = [1, 2, 3, 5, 8]
export class RestartHandler {
  public restarts: number
  public canceller: NodeJS.Timer
  constructor(func: (...args) => any) {
    this.canceller = setTimeout(func, RESTART_INTERVAL[this.restarts % RESTART_INTERVAL.length] * MINUTE)
  }
}

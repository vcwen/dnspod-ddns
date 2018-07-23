const childProcess: any = jest.genMockFromModule('child_process')
let forkHook = () => {/*empty */}
// tslint:disable-next-line:only-arrow-functions
childProcess.fork = function (){
  forkHook.apply(null, arguments)
}

childProcess.hookFork = (hook) => {
  forkHook = hook
}


module.exports = childProcess

/* tslint:disable no-console */
import { CommandExec } from '../src/CommandExec'
jest.mock('child_process')
import childProcess from 'child_process'
let exit: any
describe('CommandExec', () => {
  beforeAll(() => {
    exit = process.exit
    process.exit = (() => {
      // prevent exit after command run
    }) as any
  })
  afterAll(() => {
    process.exit = exit
  })
  describe('#constructor', () => {
    it('should be able to create new instance', async () => {
      const exec = new CommandExec()
      expect(exec).toBeInstanceOf(CommandExec)
    })
  })

  describe.only('#start', () => {
    it('should start ', async () => {
      const exec: any = new CommandExec()
      exec._sendMessage = async (msg: any) => {
        expect(msg).toEqual({
          action: 'start',
          domain: 'ok.com',
          loginToken: 'logintoken',
          name: 'test',
          subdomain: 'sub'
        })
      }
      const cp = childProcess as any
      // const sendSpy = jest.spyOn(exec.sock, 'send')
      // sendSpy.mockImplementation(() => {
      //   // do thing, let it time out
      // })
      cp.hookFork((path) => {
        expect(path).toMatch(/.+\/src\/worker/)
      })
      await exec.start('sub', 'ok.com', 'logintoken', 'test')
    })
    it.only('should show error if token is not present', () => {
      const spy = jest.spyOn(console, 'error')

      const exec = new CommandExec()
      exec.start('sub', 'ok.com', '')
      expect(spy).toHaveBeenCalledWith('Loin Token is required.')
      spy.mockRestore()
    })
    it('should show error if domain or subdomain is not present', async () => {
      const exec = new CommandExec()
      const spy = jest.spyOn(console, 'error')
      await exec.start('sub', '', 'logintoken')
      expect(spy).toHaveBeenCalledWith('Domain and sub domain are required.')
      exec.start('', 'domain', 'logintoken')
      expect(spy).toHaveBeenCalledWith('Domain and sub domain are required.')
      spy.mockRestore()
    })
  })
  describe('#stop', () => {
    it('should stop with name or all ', async () => {
      const exec: any = new CommandExec()
      exec._sendMessage = (msg: any) => {
        expect(msg).toEqual({ action: 'stop', name: 'test' })
        return Promise.resolve()
      }
      return exec.stop('test')
    })
    it('should require name ', async () => {
      const exec: any = new CommandExec()
      const spy = jest.spyOn(console, 'error')
      await exec.stop('')
      expect(spy).toHaveBeenCalledWith('Name is required.')
      spy.mockRestore()
      return
    })
    it("should print out no such ddns instance when name doesn't exist.", async () => {
      const exec: any = new CommandExec()
      const spy = jest.spyOn(console, 'error')
      const sendSpy = jest.spyOn(exec.sock, 'send')
      sendSpy.mockImplementation((data, callback) => {
        if (data.action === 'stop') {
          callback(new Error(`${'not_exist'} doesn't exist.`))
        } else {
          callback()
        }
      })
      await exec.stop('not_exist')
      expect(spy).toHaveBeenCalledWith("not_exist doesn't exist.")
      spy.mockRestore()
      sendSpy.mockRestore()
      return
    })
  })
  describe('#list', () => {
    it('should list all domains ', async () => {
      const exec: any = new CommandExec()
      const spy = jest.spyOn(console, 'log')
      spy.mockImplementationOnce((text: string) => {
        expect(text).toMatch(/.*test.*sync.*test.*example.com.*11.11.1.2/)
      })
      const sendSpy = jest.spyOn(exec.sock, 'send')
      sendSpy.mockImplementation((data, callback) => {
        if (data.action === 'PING') {
          callback()
        } else {
          expect(data).toEqual({ action: 'list' })
          callback(null, [['test', 'sync', 'test', 'example.com', '11.11.1.2']])
        }
      })
      await exec.list()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
      sendSpy.mockRestore()
    })
  })
})

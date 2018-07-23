/* tslint:disable no-console */
import axon from 'axon'
import { CommandExec } from '../src/CommandExec'
jest.mock('child_process')
import childProcess from 'child_process'
describe('CommandExec', () => {
  describe('#constructor', () => {
    it('should be able to create new instance', async () => {
      const exec = new CommandExec()
      expect(exec).toBeInstanceOf(CommandExec)
    })
  })

  describe('#start', () => {
    it('should start ', async () => {
      const exec: any = new CommandExec()
      exec._sendMessage = (msg: any) => {
        expect(msg).toEqual({
          action: 'start',
          domain: 'ok.com',
          loginToken: 'logintoken',
          name: 'test',
          subdomain: 'sub'
        })
        return Promise.resolve()
      }
      const cp = childProcess as any
      cp.hookFork((path) => {
        expect(path).toMatch(/.+\/src\/worker/)
      })
      return exec.start('sub', 'ok.com', 'logintoken', 'test')
    })
    it('should show error if token is not present', () => {
      const errlog = console.error
      console.error = (text) => {
        expect(text).toMatch('Loin Token is required.')
      }
      const exec: any = new CommandExec()
      exec.start('sub', 'ok.com')
      console.error = errlog
    })
    it('should show error if domain or subdomain is not present', () => {
      const exec: any = new CommandExec()
      const logError = console.error
      console.error = jest.fn()
      exec.start('sub', '', 'logintoken')
      exec.start('', 'domain', 'logintoken')
      expect((console.error as any).mock.calls.length).toBe(2)
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
  })
  describe('#list', () => {
    it('should list all domains ', async () => {
      const exec: any = new CommandExec()
      exec.sock._sendHandler = (data, callback) => {
        expect(data).toEqual({ action: 'list' })
        callback(null, [['test', 'sync', 'test', 'example.com', '11.11.1.2']])
      }
      exec._ping = () => {
        return true
      }
      const log: any = console.log
      console.log = (text: string) => {
        expect(text).toMatch(/.*test.*sync.*test.*example.com.*11.11.1.2/)
      }
      await exec.list()
      console.log = log
    })
  })
})

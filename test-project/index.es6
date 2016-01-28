'use strict';
import Logger from '../src-build'
import { random } from 'lodash'

function testLog(log) {
  log.reg()
    .info('info message')
    .debug('debug message')
    .warn('warning message')
    .error('error: %s', new Error('123'))
    .error('error: %s', {
      message: 'JSON.stringify cannot serialize cyclic structures.',
      stack:  'stringify@[native code]\nwrapper\n\nglobal code\nevaluateJavaScript@[native code]\nevaluate\nfile:///home/nskazki/node.js/work-projects/dmca-ip-search-service/phantom-farm/worker/node_modules/node-phantom-simple/bridge.js:121:61'
    })
}

function main() {
  let log = new Logger({ minLevel: 'warn' })
  testLog(log)
}

setTimeout(main, 0)

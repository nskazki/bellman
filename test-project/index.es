'use strict';
import Logger from '../src-build'
import { random } from 'lodash'

function testLog(log) {
  log.reg()
    .info('info message')
    .debug('debug message')
    .warn('warning message')
    .error('error: %s', new Error())
}

function main() {
  let log = new Logger({ minLevel: 'warn' })
  testLog(log)
}

setTimeout(main, 0)

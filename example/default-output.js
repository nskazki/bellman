'use strict'

import Logger from '../src'

new Logger()
  .reg()
  .info('info message')
  .debug('debug message')
  .warn('warning message')
  .error('error: %s', new Error())

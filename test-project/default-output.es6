import Logger from '..'
let log = new Logger()
  .reg()
  .info('info message')
  .debug('debug message')
  .warn('warning message')
  .error('error: %s', new Error())

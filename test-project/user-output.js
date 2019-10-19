'use strict'

let Logger = require('..')
let userConfig = {
  timeTmp: 'HH:mm',
  lineTmp: ':level :time :caller :message',
  colorize: true,
  callerColor: 'yellow.bold',
  levelMap: {
    'debug': 'blue',
    'info': 'green',
    'panic': 'red'
  },
  levelMin: 'debug',
  isFullStack: true
}

new Logger(userConfig)
  .reg()
  .info('info line')
  .debug('debug line')
  .panic('panic line: %s', new Error())

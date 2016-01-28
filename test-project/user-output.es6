var Logger = require('..')
var userConfig = {
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
var logger = new Logger(userConfig)
    .reg()
    .info('info line')
    .debug('debug line')
    .panic('panic line: %s', new Error())

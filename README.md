# Bellman

Yet another console logger. A pretty and powerful one, though.

```
yarn add bellman
```

## Methods

 - `reg` - registers a file from which methods that print console messages will be called in order to adjust the width of the `:caller` row

### Default config

```js
import Logger from 'bellman'

new Logger()
  .reg()
  .info('info message')
  .debug('debug message')
  .warn('warning message')
  .error('error: %s', new Error())
```

![Default config](/misc/default-config.png)

### Custom config

```js
import Logger from 'bellman'

const userConfig = {
  timeTmp: 'HH:mm',
  lineTmp: ':level :time :caller :message',
  colorize: true,
  callerColor: 'yellow.bold',
  levelMap: {
    debug: 'blue',
    info: 'green',
    panic: 'red'
  },
  levelMin: 'debug',
  isFullStack: true
}

new Logger(userConfig)
  .reg()
  .info('info line')
  .debug('debug line')
  .panic('panic line: %s', new Error())
```

![Custom config](/misc/custom-config.png)

## Config

 - `lineTmp` - sets the logging line format. Supported placeholders:
    * `:time` - a timestamp in the format defined by the `timeTmp` config option
    * `:level` - a name of the logging method that has been called
    * `:caller` - a name of the file and a number of the line from which the logging method has been called
    * `:message` - a formatted message combined from the arguments passed to the logging method ([util.format](https://nodejs.org/api/util.html#util_util_format_format) is used to fromat messages)
 - `timeTmp` - sets the timestamp format ([moment](https://github.com/moment/moment) is used to format timestamps)
 - `colorize` - overrides whether the coloring should be used or not ([chalk](https://github.com/chalk/chalk) is used for colorization)
 - `callerColor` - sets the `:caller` part color.
 - `levelMap` - sets the names, priorities, and colors of the logging methods
 - `levelMin` - sets the logging level
 - `isFullStack` - sets whether the error stack formatter should be used or not
    - if unset, all the lines that refer files out of the project's directory and all the files within `node_modules` directories will be removed
    - if set, no modifications will be applied to the error-stacks
    - `isFullStack` may be overridden with `STACK=full` and `FULLSTACK=true` environment variables

## Events

 - `log` - emits metadata of a logged line:
   - `time` - a formateed timestamp
   - `level` - a name of the logged message that has been called
   - `caller` - a name of the file and a number of the line from which the logging method has been called
   - `message` - a formatted message
   - `args` - arguments passed the logged message

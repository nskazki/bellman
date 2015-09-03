# bellman

Аккуратный консольныый логгер.

```bash
npm i bellman
```

### Public methods
* `reg` - Служит для регистрации файлов, в которух будут вызванны логирующие методы. Нужен для определения минимальной ширины отводмой под столбец `:caller`.

### Default output
```js
import Logger from 'bellman'
let log = new Logger()
  .reg()
  .info('info message')
  .debug('debug message')
  .warn('warning message')
  .error('error: %s', new Error())
```
![Default output](/accompanying-files/default-output.png)

### User output
```js
var Logger = require('bellman')
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
```
![User output](/accompanying-files/user-output.png)

# Config params
 * `timeTmp` - Задает формат `:time` части. Для форматирования используется библиотека [moment](https://github.com/moment/moment).
 * `lineTmp` - Задает формат строки логируемого сообщения.
    * `:time` - Таймштамп, формат задается параметром `timeTmp`.
    * `:level` - Соотвествует имени вызванного метода логгирования.
    * `:caller` - Имя файла и номер строки на которой был вызван логирующий метод.
    * `:message` - Отформатированное сообщение, составленное из переданных аргументов. Форматирование осуществляется функцией [util.format](https://nodejs.org/api/util.html#util_util_format_format).
 * `colorize` - Явно задает использовать окрашивание или нет. Для окрашивания используется библиотека [chalk](https://github.com/chalk/chalk).
 * `callerColor` - Задает цвет окрашивания `:caller` части.
 * `levelMap` - Задает имена, порядок приоритетов и цвета окрашивания логирующих методов.
 * `levelMin` - Задает имя минимально отображаемого приоритета.
 * `isFullStack` - Задает форматирование стэка ошибок. 
    * Из неполного стэка удаляются файлы расположенные вне дирректории проекта и содержащие в пути папку `node_modules`. Корень дирректории проекта соответствует `__dirname` корневого модуля.
    * Если указано выводить полный стэк ошибок, то никаких модификаций не вносится. Параметр может быть так же задани при момощи переменных окружения `STACK=full` и `FULLSTACK=true`

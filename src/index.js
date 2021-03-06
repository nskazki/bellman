'use strict'

import { debugEvents, debugMethods } from 'simple-debugger'
import { dirname, normalize, join } from 'path'
import { inspect, format } from 'util'
import { isNull, isObject, isString,
  isFunction, lt, includes, padEnd,
  first, last, get, keys, values, chain } from 'lodash'
import uncolor from 'uncolor'
import { EventEmitter } from 'events'
import chalk from 'chalk'
import moment from 'moment'

const pervious = value => value
const nonEmptyStr = value => isString(value) && (value.length > 0)

export default class Bellman extends EventEmitter {
  constructor(opt = {}) {
    super()

    debugEvents(this)
    debugMethods(this, ['on', 'once', 'emit', 'addListener', 'removeListener'])

    this.opt = new BellmanOpt(opt)
    this.callers = ['<unknow>']
    this.opt.levels.forEach(level => {
      this[level] = this.log.bind(this, level)
    })
  }

  reg() {
    const caller = this.getCaller()
    if (isObject(caller)) this.callers.push(caller.shortFile)
    return this
  }

  log(level, ...args) {
    const isForseType = this.opt.levels.indexOf(level) === -1
    if (isForseType) level = 'info'

    if (lt(
        this.getLevelWeight(level),
        this.getLevelWeight(this.opt.levelMin))) {
      return this
    }

    const strArgs = args.map(this.formatValue.bind(this))
    const message = format(...strArgs)

    const caller = this.getCaller()
    const callerPos = isObject(caller)
      ? `${caller.shortFile}:${caller.line}`
      : first(this.callers)

    const timestamp = this.getTimestamp()

    const levelLogger = (level === 'error')
      ? console.error
      : console.info
    const levelColor = this.opt.levelMap[level]
    const levelDyer = this.getDyer(levelColor)

    const callerColor = this.opt.callerColor
    const callerDyer = this.getDyer(callerColor)

    const line = this.opt.lineTmp
      .replace(':time', timestamp)
      .replace(':level', levelDyer(padEnd(level, this.levelPadSize)))
      .replace(':caller', callerDyer(padEnd(callerPos, this.callerPadSize)))
      .replace(':message', message)

    levelLogger(line)
    this.emit('log', {
      level, args,
      time: timestamp,
      caller: callerPos,
      message: uncolor(message)
    })

    return this
  }

  formatValue(value) {
    const str = isObject(value)
      ? this.formatObject(value)
      : value
    return this.formatString(str)
  }

  formatError(value) {
    const newLine = '\n    '
    try {
      const stack = this.getStack(value)
      const head = this.opt.isFullStack
        ? first(stack).full
        : first(stack).short
      const tail = stack.slice(1)
        .filter(el => this.opt.isFullStack || el.isPartOfProject)
        .map(el => this.opt.isFullStack ? el.full : el.short)

      const rawMsg = !/\[object/.test('' + value)
        ? '' + value
        : isString(value.message)
          ? `Error: ${value.message}`
          : `Error: ${JSON.stringify(value)}`

      const message = `⬎\n${rawMsg}`
        .replace(/\n/g, newLine)
      return [message, head, ...tail].join(newLine)
    } catch (_err) {
      if (true
        && isObject(value)
        && nonEmptyStr(value.stack) && nonEmptyStr(value.message)
        && includes(value.stack, value.message)) {
        return `⬎\n${value.stack}`.replace(/\n/g, newLine)
      } else if (true
        && isObject(value)
        && nonEmptyStr(value.stack) && nonEmptyStr(value.message)) {
        const stack = value.stack
          .split(/\n|\r/g)
          .filter(el => isString(el) && (el.length > 0))
          .map(el => el.replace(/^\s+/, ''))
          .join(newLine)
        return `⬎\nError: ${value.message}\nStack: ${stack}`.replace(/\n/g, newLine)
      } else if (true
        && isObject(value)
        && (nonEmptyStr(value.message) || nonEmptyStr(value.stack))) {
        return `⬎\nError: ${nonEmptyStr(value.message) ? value.message : value.stack}`.replace(/\n/g, newLine)
      } else {
        return `${JSON.stringify(value)}`
      }
    }
  }

  formatObject(value) {
    return isString(value.stack)
      ? this.formatError(value)
      : inspect(value, { depth: null, colors: true })
  }

  formatString(value) {
    return ('' + value)
      .replace(/\r/g, '')
      .replace(/\n/g, '\r\v')
  }

  getDyer(color) {
    return this.opt.colorize
      ? isFunction(get(chalk, color))
        ? get(chalk, color)
        : pervious
      : pervious
  }

  getTimestamp() {
    return moment().format(this.opt.timeTmp)
  }

  getCaller(error = new Error()) {
    return chain(this.getStack(error))
      .filter(el => el.isPartOfProject)
      .first()
      .value()
  }

  getStack(error = new Error()) {
    return error.stack
      .split('\n')
      .filter(l => StackEl.isStackEl(l))
      .map(l => new StackEl(l, this.projectDir))
  }

  getLevelWeight(level) {
    return this.opt.levels.indexOf(level)
  }

  get callerPadSize() {
    return chain(this.callers)
      .map(l => l.length + ':999'.length)
      .sort()
      .last().value()
  }

  get levelPadSize() {
    return chain(this.opt.levels)
      .map(l => l.length)
      .sort()
      .last().value()
  }

  get projectDir() {
    return (function _(module) {
      return isNull(module.parent)
          ? dirname(module.filename)
          : _(module.parent)
    }(module))
  }
}

class BellmanOpt {
  constructor(opt) {
    this.opt = opt
  }

  get colorize() {
    return this.opt.colorize
      || true
  }

  get timeTmp() {
    return this.opt.timeTmp
      || 'DD/MM HH:mm:ss (Z)'
  }

  get levelMin() {
    return this.opt.levelMin
      || 'info'
  }

  get colors() {
    return values(this.levelMap)
  }

  get levels() {
    return keys(this.levelMap)
  }

  get levelMap() {
    return this.opt.levelMap
      || {
        debug: 'blue',
        info: 'green',
        warn: 'yellow',
        error: 'red'
      }
  }

  get callerColor() {
    return this.opt.callerColor
      || 'gray.bold'
  }

  get lineTmp() {
    return this.opt.lineTmp
       || ':time :level :caller :message'
  }

  get isFullStack() {
    return this.opt.isFullStack
      || /full/i.test(process.env.STACK)
      || /true/i.test(process.env.FULLSTACK)
  }
}

class StackEl {
  constructor(rawStackEl, projectDir) {
    const getFuncEl  = (raw) => last(/\((.+)\)/.exec(raw))
    const getMainEl  = (raw) => last(/at\s(.+)/.exec(raw))
    const getStackEl = (raw) => getFuncEl(raw) || getMainEl(raw)
    const getFunc    = (raw) => last(/\s+at\s(.+)\s\(/.exec(raw))

    const getLine    = (el) => last(/:(\d+):/.exec(el))
    const getFile    = (el) => /^(.+?):/.test(el)
      ? normalize(last(/^(.+?):/.exec(el)))
      : el

    this.projectDir = projectDir
    this.rawStackEl = rawStackEl
    this.stackEl = getStackEl(this.rawStackEl)

    this.func = getFunc(this.rawStackEl)
    this.line = getLine(this.stackEl)
    this.file = getFile(this.stackEl)
  }

  valueOf() {
    return this.full
  }

  get short() {
    const fLine = isString(this.line)
      ? `:${this.line}`
      : ''
    return isString(this.func)
      ? `    at ${this.func} (${this.shortFile}${fLine})`
      : `    at ${this.shortFile}${fLine}`
  }

  get full() {
    const fLine = isString(this.line)
      ? `:${this.line}`
      : ''
    return isString(this.func)
      ? `    at ${this.func} (${this.file}${fLine})`
      : `    at ${this.file}${fLine}`
  }

  get shortFile() {
    return this.file
      .replace(this.projectDir, '')
      .replace(/^[/\\]/, '')
  }

  get isPartOfProject() {
    return !this.isPartOfNodeModules
      && includes(this.file, this.projectDir)
  }

  get isPartOfNodeModules() {
    return includes(this.file, 'node_modules')
      || includes(this.file, join('bellman', 'src'))
  }

  static isStackEl(l) {
    return /^\s+at\s/.test(l)
  }
}

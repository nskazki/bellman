'use strict';

import chalk from 'chalk'
import moment from 'moment'
import { dirname, normalize, join } from 'path'
import { inspect, format } from 'util'
import { isNull, isObject, isString, isFunction, lt, includes,
  padLeft, padRight, extend,
  first, last, get, keys, values, chain } from 'lodash'

let pervious = (value) => value

export default class Bellman {
  constructor(opt = {}) {
    this.opt = new BellmanOpt(opt)
    this.callers = [ '<unknow>' ]
    this.opt.levels.forEach(level => {
      this[level] = this.log.bind(this, level)
    })
  }

  reg() {
    let caller = this.getCaller()
    if (isObject(caller)) this.callers.push(caller.shortFile)
    return this
  }

  log(level, ...args) {
    let isForseType = this.opt.levels.indexOf(level) === -1
    if (isForseType) level = 'info'

    if (lt(
        this.getLevelWeight(level),
        this.getLevelWeight(this.opt.levelMin)))
      return this

    let strArgs = args.map(this.formatValue.bind(this))
    let message = format(...strArgs)

    let caller = this.getCaller()
    let callerPos = isObject(caller)
      ? `${caller.shortFile}:${caller.line}`
      : first(this.callers)

    let timestamp = this.getTimestamp()

    let levelLogger = (level === 'error')
      ? console.error
      : console.info
    let levelColor = this.opt.levelMap[level]
    let levelDyer = this.getDyer(levelColor)

    let callerColor = this.opt.callerColor
    let callerDyer = this.getDyer(callerColor)

    let line = this.opt.lineTmp
      .replace(':time', timestamp)
      .replace(':level', levelDyer(padRight(level, this.levelPadSize)))
      .replace(':caller', callerDyer(padRight(callerPos, this.callerPadSize)))
      .replace(':message', message)

    levelLogger(line)

    return this
  }

  formatValue(value) {
    let str = isObject(value)
      ? this.formatObject(value)
      : value
    return this.formatString(str)
  }

  formatError(value) {
    let stack = this.getStack(value)
    let head = this.opt.isFullStack
      ? first(stack).full
      : first(stack).short
    let tail = stack.slice(1)
      .filter(el => this.opt.isFullStack || el.isPartOfProject)
      .map(el => this.opt.isFullStack ? el.full : el.short)

    let newLine = '\n    '
    let message = `⬎\n${value.toString()}`
      .replace(/\n/g, newLine)
    return [ message, head, ...tail ].join(newLine)
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

  getTimestamp(value) {
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
    })(module)
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
        "debug": "blue",
        "info": "green",
        "warn": "yellow",
        "error": "red"
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
    let getFuncEl  = (raw) => last(/\((.+)\)/.exec(raw))
    let getMainEl  = (raw) => last(/at\s(.+)/.exec(raw))
    let getStackEl = (raw) => getFuncEl(raw) || getMainEl(raw)
    let getFunc    = (raw) => last(/\s+at\s(.+)\s\(/.exec(raw))

    let getLine    = (el) => last(/:(\d+):/.exec(el))
    let getFile    = (el) => /^(.+?):/.test(el)
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
    let fLine = isString(this.line)
      ? `:${this.line}`
      : ''
    return isString(this.func)
      ? `    at ${this.func} (${this.shortFile}${fLine})`
      : `    at ${this.shortFile}${fLine}`
  }

  get full() {
    let fLine = isString(this.line)
      ? `:${this.line}`
      : ''
    return isString(this.func)
      ? `    at ${this.func} (${this.file}${fLine})`
      : `    at ${this.file}${fLine}`
  }

  get shortFile() {
    return this.file
      .replace(this.projectDir, '')
      .replace(/^[\/\\]/, '')
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

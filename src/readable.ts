/* tslint:disable no-conditional-assignment no-empty */
import { Readable, ReadableOptions } from 'stream'
import { iterate } from 'iterama'
import noop from './noop'
import isPositive from './is-positive-number'

export type MakeReadableOptions = {
  log?: typeof console.log,
  errorAtStep?: number,
  continueOnError?: boolean
  delayMs?: number,
  eager: boolean,
}

const readable = ({ log = noop, errorAtStep, continueOnError = false, eager, delayMs }: MakeReadableOptions) =>
  (readableOptions: ReadableOptions) => (iterable: Iterable<any>) => {
    const it = iterate(iterable)
    let i = 0

    const push = function (this: Readable): boolean {
      if (i === errorAtStep) {
        log('emitting error at %d', i)
        this.emit('error', new Error(`error at ${i}`))

        if (!continueOnError) {
          log('break on error at %d', i)
          this.push(null)

          return false
        }
      }

      const iteratorResult = it.next()

      if (iteratorResult.done) {
        log('complete at %d', i)
        this.push(null)

        return false
      }

      log('push %d', i)

      const isOk = this.push(
        iteratorResult.value === null
          ? undefined
          : iteratorResult.value
      )

      if (!isOk) {
        log('backpressure at %d', i)
      }

      ++i

      return isOk
    }

    const syncHandler = function (this: Readable) {
      if (eager) {
        log('eager read begin at %d', i)
        while (push.call(this)) {}
        log('eager read end at %d', i)
      } else {
        log('lazy read %d', i)
        push.call(this)
      }
    }

    const asyncHandler = function (this: Readable) {
      log('async read started')
      setTimeout(syncHandler.bind(this), delayMs!)
    }

    const readable = new Readable({
      ...readableOptions,
      read: isPositive(delayMs)
        ? asyncHandler
        : syncHandler,
    })

    readable.on('removeListener', (name) => {
      log('removeListener for \'%s\', total: %d', name, readable.listenerCount(name))
    })

    readable.on('newListener', (name) => {
      log('newListener for \'%s\', total: %d', name, readable.listenerCount(name) + 1)
    })

    return readable
  }

export default readable

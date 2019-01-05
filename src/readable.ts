/* tslint:disable no-conditional-assignment no-empty */
import { Readable, ReadableOptions } from 'stream'
import { iterate } from 'iterama'
import isPositiveNumber from './is-positive-number'
import noop from './noop'

export type MakeReadableOptions = {
  log?: typeof console.log
  errorAtStep?: number
  errorBehavior?: 'break' | 'continue',
  delayMs?: number
  eager?: boolean
}

const readable = ({ log = noop, errorAtStep, errorBehavior, eager = false, delayMs = 0 }: MakeReadableOptions = {}) =>
  (readableOptions: ReadableOptions) => (iterable: Iterable<any>) => {
    let i = 0
    let inProgress = false

    const iterator = iterate(iterable)

    const push = function (this: Readable, iteratorResult: IteratorResult<any>, i: number) {
      if (isPositiveNumber(errorAtStep) && i === errorAtStep) {
        log('emitting error at %d', i)
        this.emit('error', new Error(`emitting error at ${i}`))

        if (errorBehavior === 'break') {
          this.push(null)

          return null
        }
      }

      if (iteratorResult.done) {
        log('complete at %d', i)
        this.push(null)

        return null
      }

      log('push %d', i)

      const res = this.push(
        iteratorResult.value === null
          ? undefined
          : iteratorResult.value
      )

      if (!res) {
        log('backpressure at %d', i)
      }

      return res
    }

    const syncHandler = function (this: Readable) {
      if (inProgress) return

      if (eager) {
        inProgress = true
        log('eager read begin at %d', i)
        while (push.call(this, iterator.next(), i++)) {}
        log('eager read end at %d', i - 1)
        inProgress = false
      } else {
        log('lazy read %d', i)
        push.call(this, iterator.next(), i++)
      }
    }

    const asyncHandler = function (this: Readable) {
      if (inProgress) return
      log('async read started')
      setTimeout(() => {
        syncHandler.call(this)
      }, delayMs)
    }

    const readable = new Readable({
      ...readableOptions,
      read: isPositiveNumber(delayMs)
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

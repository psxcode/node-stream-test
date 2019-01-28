import { Writable, WritableOptions } from 'stream'
import noop from './noop'
import isPositive from './is-positive-number'

export type MakeWritableOptions = {
  log?: typeof console.log
  delayMs?: number
  errorAtStep?: number
}

const writable = ({ delayMs, errorAtStep, log = noop }: MakeWritableOptions = {}) =>
  (writableOptions: WritableOptions = {}) => (sink: (data: any) => void) => {
    let i = 0

    const syncHandler = (chunk: any, _: string, cb: (err?: Error) => void) => {
      log('actual write %d', i)
      sink(chunk)
      if (i === errorAtStep) {
        log('returning an error at %d', i)
        cb(new Error(`error at step ${i}`))
      } else {
        cb()
      }
      ++i
    }

    const asyncHandler = (chunk: any, encoding: string, cb: (err: any) => void) => {
      log('async write started')
      setTimeout(() => syncHandler(chunk, encoding, cb), delayMs!)
    }

    const syncFinal = (cb: () => void) => {
      log('final at %d', i)
      cb()
    }

    const asyncFinal = (cb: () => void) => {
      log('async final started')
      setTimeout(() => syncFinal(cb), delayMs!)
    }

    const writable = new Writable({
      ...writableOptions,
      write: isPositive(delayMs)
        ? asyncHandler
        : syncHandler,
      final: isPositive(delayMs)
        ? asyncFinal
        : syncFinal,
    })

    writable.on('removeListener', (name) => {
      log('removeListener for \'%s\', total: %d', name, writable.listenerCount(name))
    })

    writable.on('newListener', (name) => {
      log('newListener for \'%s\', total: %d', name, writable.listenerCount(name) + 1)
    })

    return writable
  }

export default writable

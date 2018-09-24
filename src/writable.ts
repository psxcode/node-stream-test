import { Writable, WritableOptions } from 'stream'
import isPositiveNumber from './is-positive-number'
import noop from './noop'

export type MakeWritableOptions = {
  log?: typeof console.log
  delayMs?: number
  errorAtStep?: number
}

const writable = ({ delayMs = 0, errorAtStep, log = noop }: MakeWritableOptions = {}) =>
  (writableOptions: WritableOptions = {}) =>
    <T> (sink: (data: T) => void) => {
      let i = 0

      const syncHandler = (chunk: T, _: string, cb: (err?: Error) => void) => {
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

      const asyncHandler = (chunk: T, encoding: string, cb: (err: any) => void) => {
        log('async write')
        setTimeout(() => syncHandler(chunk, encoding, cb), delayMs)
      }

      const syncFinal = (cb: () => void) => {
        log('final at %d', i)
        cb()
      }

      const asyncFinal = (cb: () => void) => {
        log('async final started')
        setTimeout(() => syncFinal(cb), delayMs)
      }

      return new Writable({
        ...writableOptions,
        write: (isPositiveNumber(delayMs)
          ? asyncHandler
          : syncHandler) as any,
        final: isPositiveNumber(delayMs)
          ? asyncFinal
          : syncFinal
      })
    }

export default writable

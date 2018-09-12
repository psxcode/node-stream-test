import { Writable, WritableOptions } from 'stream'
import debug from 'debug'
import isPositiveNumber from './is-positive-number'

export interface IWritableConsumer {
  delayMs?: number
  errorAtStep?: number
}

const writable = ({ delayMs, errorAtStep }: IWritableConsumer = {}) =>
  (writableOptions: WritableOptions = {}) => {
    const dbg = debug('stream-test:writable')
    return <T> (sink: (data: T) => void) => {
      let i = 0

      const syncHandler = (chunk: T, _: string, cb: (err?: Error) => void) => {
        dbg('actual write %d', i)
        sink(chunk)
        if (i === errorAtStep) {
          dbg('returning an error at %d', i)
          cb(new Error(`error at step ${i}`))
        } else {
          cb()
        }
        ++i
      }

      const asyncHandler = (chunk: T, encoding: string, cb: (err: any) => void) => {
        dbg('async write')
        setTimeout(() => syncHandler(chunk, encoding, cb), delayMs as number)
      }

      const syncFinal = (cb: () => void) => {
        dbg('final at %d', i)
        cb()
      }

      const asyncFinal = (cb: () => void) => {
        dbg('async final started')
        setTimeout(() => syncFinal(cb), delayMs as number)
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
  }

  export default writable

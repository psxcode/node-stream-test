/* tslint:disable no-conditional-assignment no-empty */
import isPositiveNumber from './is-positive-number'
import ReadableStream = NodeJS.ReadableStream
import noop from './noop'

export type ReadableConsumerOptions = {
  log?: typeof console.log
  delayMs?: number
  readSize?: number
  eager?: boolean
}

const readableConsumer = ({ log = noop, delayMs = 0, readSize, eager = false }: ReadableConsumerOptions = {}) =>
  (stream: ReadableStream, sink: (data: any) => void) => {
    let i = 0
    const eagerReader = (i: number) => {
      let chunk: any
      log('eager read at %d begin', i)
      while (chunk = stream.read(readSize)) sink(chunk)
      log('eager read at %d done', i)
    }
    const lazyReader = (i: number) => {
      let chunk: any
      log('lazy read at %d begin', i);
      (chunk = stream.read(readSize)) && sink(chunk)
      log('lazy read at %d done', i)
    }
    const asyncHandler = () => {
      log('received \'readable\' event at %d', i)
      setTimeout(
        eager
          ? eagerReader.bind(null, i)
          : lazyReader.bind(null, i),
        delayMs
      )
      ++i
    }
    const syncHandler = () => {
      log('received \'readable\' event at %d', i)
      eager
        ? eagerReader(i)
        : lazyReader(i)
      ++i
    }
    const unsubscribe = () => {
      log('unsubscribe at %d', i)
      stream.removeListener('readable', asyncHandler)
      stream.removeListener('readable', syncHandler)
      stream.removeListener('end', unsubscribe)
    }

    return () => {
      log('consumer subscribe')
      stream.on('readable', isPositiveNumber(delayMs)
        ? asyncHandler
        : syncHandler)
      stream.on('end', unsubscribe)

      return unsubscribe
    }
  }

export default readableConsumer

/* tslint:disable no-conditional-assignment no-empty */
import isPositiveNumber from './is-positive-number'
import ReadableStream = NodeJS.ReadableStream

export type ReadableConsumerOptions = {
  log: typeof console.log
  delayMs?: number
  readSize?: number
  eager?: boolean
}

const readableConsumer = ({ log, delayMs, readSize, eager }: ReadableConsumerOptions) =>
  <T> (stream: ReadableStream, sink: (data: T) => void) => {
    let i = 0
    const eagerReader = (i: number) => {
      let chunk: T
      log('eager read at %d begin', i)
      while (chunk = stream.read(readSize) as any) sink(chunk)
      log('eager read at %d done', i)
    }
    const lazyReader = (i: number) => {
      let chunk: T
      log('lazy read at %d begin', i);
      (chunk = stream.read() as any) && sink(chunk)
      log('lazy read at %d done', i)
    }
    const asyncHandler = () => {
      log('received \'readable\' event at %d', i)
      setTimeout(eager
        ? eagerReader.bind(null, i)
        : lazyReader.bind(null, i),
        delayMs as number)
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
      stream.once('end', unsubscribe)
      return unsubscribe
    }
  }

export default readableConsumer

import * as debug from 'debug'
import WritableStream = NodeJS.WritableStream

export interface IProducer {
  eager?: boolean
}

const producer = ({ eager }: IProducer = {}) =>
  <T> (iterator: Iterator<T>, maxLength = 0) => (stream: WritableStream) => {
    const dbg = debug('stream-test:data-producer')
    let i = 0
    const eagerWriter = () => {
      dbg('eager writing begin at %d', i)
      while (writeChunk(iterator.next())) {
        ++i
      }
      dbg('eager writing done at %d', i - 1)
    }
    const lazyWriter = () => {
      dbg('lazy writing begin at %d', i)
      writeChunk(iterator.next(), lazyWriter)
      dbg('lazy writing done at %d', i - 1)
    }
    const writeChunk = (iteratorResult: IteratorResult<T>, cb?: () => void): boolean => {
      if (iteratorResult.done || (maxLength > 0 && i >= maxLength)) {
        dbg('ending %d', i)
        stream.end()
        return false
      } else {
        dbg('writing %d', i)
        const backpressure = stream.write(iteratorResult.value as any, cb)
        if (!backpressure) {
          dbg('backpressure at %d', i)
        }
        return backpressure
      }
    }
    const onDrainEvent = () => {
      dbg('received \'drain\' event %d', i)
      eager ? eagerWriter() : lazyWriter()
    }
    const unsubscribe = () => {
      dbg('unsubscribe')
      stream.removeListener('drain', onDrainEvent)
      stream.removeListener('finish', unsubscribe)
    }

    return () => {
      dbg('producer subscribe')
      stream.on('drain', onDrainEvent)
      stream.once('finish', unsubscribe)
      /* drain event could already be emitted, try to write once */
      eager ? eagerWriter() : lazyWriter()
      return unsubscribe
    }
  }

export default producer

import WritableStream = NodeJS.WritableStream
import { iterate } from 'iterama'
import noop from './noop'

export type ProducerOptions = {
  log?: typeof console.log
  eager?: boolean
}

const producer = ({ eager = false, log = noop }: ProducerOptions = {}) =>
  (iterable: Iterable<any>) => (stream: WritableStream) => {
    const it = iterate(iterable)
    let i = 0
    const eagerWriter = () => {
      log('eager writing begin at %d', i)
      while (writeChunk(it.next())) {
        ++i
      }
      log('eager writing done at %d', i - 1)
    }
    const lazyWriter = () => {
      log('lazy writing begin at %d', i)
      writeChunk(it.next(), lazyWriter)
      log('lazy writing done at %d', i - 1)
    }
    const writeChunk = (iteratorResult: IteratorResult<any>, cb?: () => void): boolean => {
      if (iteratorResult.done) {
        log('ending %d', i)
        stream.end()

        return false
      } else {
        log('writing %d', i)
        const backpressure = stream.write(iteratorResult.value, cb)
        if (!backpressure) {
          log('backpressure at %d', i)
        }

        return backpressure
      }
    }
    const onDrainEvent = () => {
      log('received \'drain\' event %d', i)
      eager ? eagerWriter() : lazyWriter()
    }
    const unsubscribe = () => {
      log('unsubscribe')
      stream.removeListener('drain', onDrainEvent)
      stream.removeListener('finish', unsubscribe)
    }

    return () => {
      log('producer subscribe')
      stream.on('drain', onDrainEvent)
      stream.once('finish', unsubscribe)
      /* drain event could already be emitted, try to write once */
      eager ? eagerWriter() : lazyWriter()

      return unsubscribe
    }
  }

export default producer

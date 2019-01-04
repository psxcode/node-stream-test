import { iterate } from 'iterama'
import noop from './noop'

export type ProducerOptions = {
  log?: typeof console.log
  eager?: boolean
  errorBehavior?: 'break' | 'continue',
}

const producer = ({ eager = false, log = noop, errorBehavior }: ProducerOptions = {}) =>
  (iterable: Iterable<any>) => (stream: NodeJS.WritableStream) => {
    const it = iterate(iterable)
    let i = 0
    const eagerWriter = () => {
      log('eager writing begin at %d', i)
      while (writeChunk(it.next())) {}
      log('eager writing done at %d', i)
    }
    const lazyWriter = (err?: Error) => {
      if (err) {
        log('error received at %d', i)
        if (errorBehavior === 'break') {
          unsubscribe()

          return
        }
      }

      log('lazy writing begin at %d', i)
      writeChunk(it.next(), lazyWriter)
      log('lazy writing done at %d', i)
    }
    const writeChunk = (iteratorResult: IteratorResult<any>, cb?: () => void): boolean => {
      if (iteratorResult.done) {
        log('ending %d', i)
        stream.end()

        return false
      } else {
        log('writing to stream %d', i++)
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
      /* subscribe */
      log('producer subscribe')
      stream.on('drain', onDrainEvent)
      stream.on('finish', unsubscribe)
      /* drain event could already be emitted, try to write once */
      eager ? eagerWriter() : lazyWriter()

      return unsubscribe
    }
  }

export default producer

import ReadableStream = NodeJS.ReadableStream
import noop from './noop'

export type DataConsumerOptions = {
  log?: typeof console.log
}

const dataConsumer = ({ log = noop }: DataConsumerOptions = {}) =>
  (sink: (data: any) => void) => (stream: ReadableStream) => {
    let i = 0
    const onDataEvent = (chunk: any) => {
      log('received \'data\' event at %d', i)
      sink(chunk)
      ++i
    }
    const unsubscribe = () => {
      log('unsubscribe at %d', i)
      stream.removeListener('data', onDataEvent)
      stream.removeListener('end', unsubscribe)
    }

    return () => {
      log('consumer subscribe')
      stream.on('data', onDataEvent)
      stream.once('end', unsubscribe)

      return unsubscribe
    }
  }

export default dataConsumer

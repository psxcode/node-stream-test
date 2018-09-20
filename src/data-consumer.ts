import ReadableStream = NodeJS.ReadableStream

export type DataConsumerOptions = {
  log: typeof console.log
}

const dataConsumer = ({ log }: DataConsumerOptions) =>
  <T> (stream: ReadableStream, sink: (data: T) => void) => {
    let i = 0
    const onDataEvent = (chunk: T) => {
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

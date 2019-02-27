import noop from './noop'

export type PushConsumerOptions = {
  log?: typeof console.log,
  continueOnError?: boolean,
}

const pushConsumer = ({ log = noop, continueOnError }: PushConsumerOptions = {}) =>
  (sink: (data: any) => void) => (stream: NodeJS.ReadableStream) => {
    let i = 0
    const onDataEvent = (chunk: any) => {
      log('received \'data\' event at %d', i)
      sink(chunk)
      ++i
    }
    const onErrorEvent = (err?: Error) => {
      log('received \'error\' event at %d', i)
      if (!continueOnError) {
        log('breaking on \'error\' event at %d', i)
        unsubscribe()
      }
      log('continuing on \'error\' event at %d', i)
    }
    const unsubscribe = () => {
      log('unsubscribe at %d', i)
      stream.removeListener('data', onDataEvent)
      stream.removeListener('end', unsubscribe)
      stream.removeListener('error', onErrorEvent)
    }

    return () => {
      /* subscribe */
      log('consumer subscribe')
      stream.on('data', onDataEvent)
      stream.on('end', unsubscribe)
      stream.on('error', onErrorEvent)

      return unsubscribe
    }
  }

export default pushConsumer

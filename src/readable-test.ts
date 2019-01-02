import debug from 'debug'
import { waitTimePromise as wait } from '@psxcode/wait'
import { createSpy } from 'spyfn'
import waitForEvents from './wait-for-events'

const readableTest = (it: (msg: string, fn: any) => any, message: string) => <T> (
  data: Iterable<T>,
  makeReadable: (data: Iterable<T>) => NodeJS.ReadableStream,
  makeConsumer: (stream: NodeJS.ReadableStream, sink: (data: T) => void) => () => void,
  expectFn?: (data: Iterable<T>, spyfn: (...args: any[]) => any) => void) =>
    it(message, async () => {
      const spy = createSpy(debug('readable-test: '))
      const stream = makeReadable(data)
      const consumer = makeConsumer(stream, spy)
      await wait(100)
      consumer()
      await waitForEvents('end', 'error')(stream)
      await wait(20)
      expectFn && expectFn(data, spy)
    })

export default readableTest

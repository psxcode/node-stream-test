import debug from 'debug'
import { createSpy } from 'spyfn'
import { waitTimePromise as wait } from '@psxcode/wait'
import waitForEvents from './wait-for-events'

const writableTest = (it: (msg: string, fn: () => any) => any, message: string) => <T> (
  data: Iterable<T>,
  makeWritable: (spy: (data: T) => void) => NodeJS.WritableStream,
  makeProducer: (stream: NodeJS.WritableStream, data: Iterable<T>) => () => void,
  expectFn?: (data: Iterable<T>, spy: (...args: any[]) => any) => void) =>
    it(message, async () => {
      const spy = createSpy(debug('writable-test:'))
      const stream = makeWritable(spy)
      const producer = makeProducer(stream, data)
      await wait(100)
      producer()
      await waitForEvents('end', 'error')(stream)
      await wait(20)
      expectFn && expectFn(data, spy)
    })

export default writableTest

import debug from 'debug'
import { waitTimePromise as wait } from '@psxcode/wait'
import { createSpy } from 'spyfn'
import waitForEvents from './wait-for-events'

const ensureArray = <T> (values: T | T[]): T[] => (Array.isArray(values) ? values : [values])

const transformTest = (it: (msg: string, fn: () => any) => any, message: string) => <T> (
  data: Iterable<T>,
  makeReadable: (data: Iterable<T>) => NodeJS.ReadableStream,
  makeWritable: (sink: (data: T) => void) => NodeJS.WritableStream,
  makeTransforms: () => NodeJS.ReadWriteStream | NodeJS.ReadWriteStream[],
  expectFn?: (data: Iterable<T>, spy: (...args: any[]) => any) => void) =>
    it(message, async () => {
      const readable = makeReadable(data)
      const spy = createSpy(debug('transform-test:'))
      const writable = makeWritable(spy)
      const transforms = ensureArray(makeTransforms())
      await wait(100)
      readable.pipe(transforms[0])
      for (let i = 1; i < transforms.length; ++i) {
        transforms[i - 1].pipe(transforms[i])
      }
      const stream = transforms[transforms.length - 1].pipe(writable)
      await waitForEvents('end', 'error')(stream)
      await wait(20)
      expectFn && expectFn(data, spy)
    })

export default transformTest

import debug from 'debug'
import { waitTimePromise as wait } from '@psxcode/wait'
import { makeDataSpy, SpyFn } from './spy'
import waitForEvents from './wait-for-events'
import ReadWriteStream = NodeJS.ReadWriteStream
import WritableStream = NodeJS.WritableStream
import ReadableStream = NodeJS.ReadableStream

const ensureArray = <T> (values: T | T[]): T[] => Array.isArray(values) ? values : [values]

const transformTest = <T> (
  data: Iterable<T>,
  makeReadable: (data: Iterable<T>) => ReadableStream,
  makeWritable: (sink: (data: T) => void) => WritableStream,
  makeTransforms: () => ReadWriteStream | ReadWriteStream[],
  expectFn?: (data: Iterable<T>, spy: SpyFn<T>) => void) =>
  it('should work', async () => {
    const readable = makeReadable(data)
    const spy = makeDataSpy<T>(debug('transform-test:'))
    const writable = makeWritable(spy)
    const transforms = ensureArray(makeTransforms())
    await wait(100)
    readable.pipe(transforms[0])
    for (let i = 0; i < transforms.length; ++i) {
      if (i + 1 < transforms.length) {
        transforms[i].pipe(transforms[i + 1])
      }
    }
    const stream = transforms[transforms.length - 1].pipe(writable)
    await waitForEvents('end', 'error')(stream)
    await wait(20)
    expectFn && expectFn(data, spy)
  })

export default transformTest

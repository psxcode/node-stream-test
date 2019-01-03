import debug from 'debug'
import { createSpy, getSpyCalls } from 'spyfn'
import { waitTimePromise as wait } from '@psxcode/wait'
import waitForEvents from './wait-for-events'
import { TestRunnerFn, MakeWritable, MakeProducer, ExpectFn } from './types'

const writableTest = (it: TestRunnerFn, message: string) => <T> (
  data: Iterable<T>,
  makeWritable: MakeWritable<T>,
  makeProducer: MakeProducer<T>,
  expectFn?: ExpectFn<T>) =>
    it(message, async (testObject) => {
      const spy = createSpy(debug('writable-test:'))
      const stream = makeWritable(spy)
      const producer = makeProducer(data)

      producer(stream)

      await waitForEvents('end', 'error')(stream)
      await wait(20)

      expectFn && expectFn(testObject, data, getSpyCalls(spy))
    })

export default writableTest

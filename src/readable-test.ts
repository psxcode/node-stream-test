import debug from 'debug'
import { waitTimePromise as wait } from '@psxcode/wait'
import { createSpy, getSpyCalls } from 'spyfn'
import waitForEvents from './wait-for-events'
import { MakeReadable, ExpectFn, TestRunnerFn, MakeConsumer } from './types'

const readableTest = (it: TestRunnerFn, message: string) => <T> (
  data: Iterable<T>,
  makeReadable: MakeReadable<T>,
  makeConsumer: MakeConsumer<T>,
  expectFn?: ExpectFn<T>) =>
    it(message, async (testObject) => {
      const spy = createSpy(debug('readable-test: '))
      const stream = makeReadable(data)
      const consumer = makeConsumer(spy)

      consumer(stream)

      await waitForEvents('end', 'error')(stream)
      await wait(20)

      expectFn && expectFn(testObject, data, getSpyCalls(spy))
    })

export default readableTest

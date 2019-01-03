import debug from 'debug'
import { waitTimePromise as wait } from '@psxcode/wait'
import { createSpy, getSpyCalls } from 'spyfn'
import waitForEvents from './wait-for-events'
import { TestRunnerFn, ExpectFn, MakeTransforms, MakeWritable, MakeReadable } from './types'

const ensureArray = <T> (values: T | T[]): T[] => (Array.isArray(values) ? values : [values])

const transformTest = (it: TestRunnerFn, message: string) => <T> (
  data: Iterable<T>,
  makeReadable: MakeReadable<T>,
  makeWritable: MakeWritable<T>,
  makeTransforms: MakeTransforms,
  expectFn?: ExpectFn<T>) =>
    it(message, async (testObject) => {
      const readable = makeReadable(data)
      const spy = createSpy(debug('transform-test:'))
      const writable = makeWritable(spy)
      const transforms = ensureArray(makeTransforms())

      readable.pipe(transforms[0])
      for (let i = 1; i < transforms.length; ++i) {
        transforms[i - 1].pipe(transforms[i])
      }
      const stream = transforms[transforms.length - 1].pipe(writable)

      await waitForEvents('end', 'error')(stream)
      await wait(20)

      await (expectFn && expectFn(testObject, data, getSpyCalls(spy)))
    })

export default transformTest

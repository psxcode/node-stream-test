import makeStrings from './make-strings'
import writableTest from './writable-test'
import expectSameCallCount from './expect-same-call-count'
import producer from './producer'
import { iterate } from 'iterama'
import writable from './writable'

describe('[ writable ]', function () {
  this.slow(1000)

  xdescribe('[]', () => {
    writableTest(makeStrings(8),
      (spy) => writable({ delayMs: 10 })({ highWaterMark: 256, decodeStrings: false })(spy),
      (stream, data) => producer({ eager: true })(iterate(data))(stream),
      expectSameCallCount)
  })
})

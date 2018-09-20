import debug from 'debug'
import makeStrings from './make-strings'
import writableTest from './writable-test'
import expectSameCallCount from './expect-same-call-count'
import producer from './producer'
import { iterate } from 'iterama'
import writable from './writable'

const writableLog = debug('writable')
const producerLog = debug('producer')

describe('[ writable ]', function () {
  this.slow(1000)

  xdescribe('[]', () => {
    writableTest(makeStrings(8),
      (spy) => writable({ delayMs: 10, log: writableLog })({ highWaterMark: 256, decodeStrings: false })(spy),
      (stream, data) => producer({ eager: true, log: producerLog })(iterate(data))(stream),
      expectSameCallCount)
  })
})

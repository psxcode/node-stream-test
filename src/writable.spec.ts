import debug from 'debug'
import makeStrings from './make-strings'
import writableTest from './writable-test'
import expectSameCallCount from './expect-same-call-count'
import producer from './producer'
import writable from './writable'

const writableLog = debug('writable')
const producerLog = debug('producer')

describe('[ writable ]', function () {
  this.slow(1000)

  xdescribe('[ writable ]', () => {
    writableTest(
      makeStrings(8),
      writable({ delayMs: 10, log: writableLog })({ highWaterMark: 256, decodeStrings: false }),
      producer({ eager: true, log: producerLog }),
      expectSameCallCount
    )
  })
})

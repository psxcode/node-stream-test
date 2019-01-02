import debug from 'debug'
import makeStrings from '../src/make-strings'
import writableTest from '../src/writable-test'
import producer from '../src/producer'
import writable from '../src/writable'

const writableLog = debug('writable')
const producerLog = debug('producer')

xdescribe('[ writable ]', function () {
  this.slow(1000)

  writableTest(it, 'should work')(
    makeStrings(8),
    writable({ delayMs: 10, log: writableLog })({ highWaterMark: 256, decodeStrings: false }),
    producer({ eager: true, log: producerLog }),
    () => {}
  )
})

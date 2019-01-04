import { describe, it } from 'mocha'
import { expect } from 'chai'
import debug from 'debug'
import { waitTimePromise as wait } from '@psxcode/wait'
import { createSpy, getSpyCalls } from 'spyfn'
import makeStrings from '../src/make-strings'
import producer from '../src/producer'
import writable from '../src/writable'
import waitForEvents from '../src/wait-for-events'

const writableLog = debug('nst-writable')
const producerLog = debug('nst-producer')

describe('[ writable ]', function () {
  this.slow(1000)

  it('should work', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-readable-test: '))
    const stream = writable({ delayMs: 10, log: writableLog })({ highWaterMark: 256, decodeStrings: false })(spy)
    const consumer = producer({ eager: true, log: producerLog })(data)

    consumer(stream)

    await waitForEvents('finish', 'error')(stream)
    await wait(20)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
  })
})

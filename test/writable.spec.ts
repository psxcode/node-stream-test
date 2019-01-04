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

  it('[ eager producer / sync writable ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = writable({ log: writableLog })({ decodeStrings: false })(spy)
    const beginTest = producer({ eager: true, log: producerLog })(data)(stream)
    const waiter = waitForEvents('finish', 'error')(stream)

    beginTest()

    await waiter
    await wait(20)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
  })

  it('[ lazy producer / sync writable ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = writable({ log: writableLog })({ decodeStrings: false })(spy)
    const beginTest = producer({ log: producerLog })(data)(stream)
    const waiter = waitForEvents('finish', 'error')(stream)

    beginTest()

    await waiter
    await wait(20)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
  })

  it('[ eager producer / async writable ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = writable({ delayMs: 10, log: writableLog })({ highWaterMark: 16, decodeStrings: false })(spy)
    const beginTest = producer({ eager: true, log: producerLog })(data)(stream)
    const waiter = waitForEvents('finish', 'error')(stream)

    beginTest()

    await waiter
    await wait(20)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
  })

  it('[ lazy producer / async writable ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = writable({ delayMs: 10, log: writableLog })({ highWaterMark: 16, decodeStrings: false })(spy)
    const beginTest = producer({ eager: false, log: producerLog })(data)(stream)
    const waiter = waitForEvents('finish', 'error')(stream)

    beginTest()

    await waiter
    await wait(20)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
  })
})

import { describe, it } from 'mocha'
import { expect } from 'chai'
import debug from 'debug'
import fn from 'test-fn'
import producer from '../src/producer'
import writable from '../src/writable'
import makeStrings from './make-strings'
import numEvents from './num-events'
import finished from './stream-finished'

describe('[ producer / writable ]', () => {
  it('[ eager producer / sync writable ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ log: debug('nst:writable') })({ decodeStrings: false })(spy)
    const beginProducing = producer({ eager: true, log: debug('nst:producer') })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  it('[ lazy producer / sync writable ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ log: debug('nst:writable') })({ decodeStrings: false })(spy)
    const beginProducing = producer({ eager: false, log: debug('nst:producer') })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  it('[ eager producer / async writable ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ delayMs: 10, log: debug('nst:writable') })({ highWaterMark: 16, decodeStrings: false })(spy)
    const beginProducing = producer({ eager: true, log: debug('nst:producer') })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  it('[ lazy producer / async writable ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ delayMs: 10, log: debug('nst:writable') })({ highWaterMark: 16, decodeStrings: false })(spy)
    const beginProducing = producer({ eager: false, log: debug('nst:producer') })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  it('[ eager producer - unsubscribe ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ log: debug('nst:writable') })({ decodeStrings: false })(spy)
    const beginProducing = producer({ eager: true, log: debug('nst:producer') })(data)(stream)

    const unsub = beginProducing()
    unsub()

    await finished(stream)

    expect(spy.calls).deep.eq([])
    expect(numEvents(stream)).eq(0)
  })

  it('[ eager producer - break on error ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ log: debug('nst:writable'), errorAtStep: 0 })({ decodeStrings: false })(spy)
    const beginProducing = producer({ eager: true, log: debug('nst:producer') })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq([
      [Array.from(data)[0]],
    ])
    expect(numEvents(stream)).eq(0)
  })

  it('[ eager producer - continue on error ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ log: debug('nst:writable'), errorAtStep: 0 })({ decodeStrings: false })(spy)
    const beginProducing = producer({ eager: true, log: debug('nst:producer'), continueOnError: true })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  it('[ lazy producer - break on error ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ log: debug('nst:writable'), errorAtStep: 0 })({ decodeStrings: false })(spy)
    const beginProducing = producer({ eager: false, log: debug('nst:producer') })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq([
      [Array.from(data)[0]],
    ])
    expect(numEvents(stream)).eq(0)
  })

  it('[ lazy producer - continue on error ]', async () => {
    const data = makeStrings(8)
    const spy = fn(debug('nst:sink: '))
    const stream = writable({ log: debug('nst:writable'), errorAtStep: 0 })({ decodeStrings: false })(spy)
    const beginProducing = producer({ eager: false, log: debug('nst:producer'), continueOnError: true })(data)(stream)

    beginProducing()

    await finished(stream)

    expect(spy.calls).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })
})

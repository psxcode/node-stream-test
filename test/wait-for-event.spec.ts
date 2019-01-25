import { EventEmitter } from 'events'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createSpy, getSpyCalls } from 'spyfn'
import { waitTimePromise as wait } from '@psxcode/wait'
import waitForEvents from '../src/wait-for-events'

describe('[ waitForEvent ]', () => {
  it('single event, no data', async () => {
    const ee = new EventEmitter()
    const spy = createSpy(() => {})
    const errSpy = createSpy(() => {})

    waitForEvents('event')(ee).then(spy, errSpy)

    await wait(0)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(getSpyCalls(errSpy)).deep.eq([])

    ee.emit('some-event')

    await wait(0)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(getSpyCalls(errSpy)).deep.eq([])

    ee.emit('event')

    await wait(0)

    expect(getSpyCalls(spy)).deep.eq([
      [undefined],
    ])
    expect(getSpyCalls(errSpy)).deep.eq([])
  })

  it('single event, with data', async () => {
    const ee = new EventEmitter()
    const spy = createSpy(() => {})
    const errSpy = createSpy(() => {})

    waitForEvents('event')(ee).then(spy, errSpy)

    ee.emit('event', 'data', 'not-delivered')

    await wait(0)

    expect(getSpyCalls(spy)).deep.eq([
      ['data'],
    ])
    expect(getSpyCalls(errSpy)).deep.eq([])
  })

  it('multiple events, with data', async () => {
    const ee = new EventEmitter()
    const spy = createSpy(() => {})
    const errSpy = createSpy(() => {})

    waitForEvents('event1', 'event2')(ee).then(spy, errSpy)

    ee.emit('event2', 'data')

    await wait(0)

    expect(getSpyCalls(spy)).deep.eq([
      ['data'],
    ])
    expect(getSpyCalls(errSpy)).deep.eq([])
  })

  it('explicit error event', async () => {
    const ee = new EventEmitter()
    const spy = createSpy(() => {})
    const errSpy = createSpy(() => {})

    waitForEvents('event', 'error')(ee).then(spy, errSpy)

    ee.emit('error', 'error-reason')

    await wait(0)

    expect(getSpyCalls(spy)).deep.eq([
      ['error-reason'],
    ])
    expect(getSpyCalls(errSpy)).deep.eq([])
  })

  it('implicit error event', async () => {
    const ee = new EventEmitter()
    const spy = createSpy(() => {})
    const errSpy = createSpy(() => {})

    waitForEvents('event')(ee).then(spy, errSpy)

    ee.emit('error', 'error-reason')

    await wait(0)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(getSpyCalls(errSpy)).deep.eq([
      ['error-reason'],
    ])
  })
})

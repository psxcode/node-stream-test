import debug from 'debug'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createSpy, getSpyCalls } from 'spyfn'
import readable from '../src/readable'
import makeStrings from '../src/make-strings'
import pushConsumer from '../src/push-consumer'
import pullConsumer from '../src/pull-consumer'
import numEvents from '../src/num-events'
import finished from '../src/stream-finished'

const logReadable = debug('nst-readable')
const logConsumer = debug('nst-consumer')

/**
 * LAZY PRODUCER
 * on every _read() pushes one chunk with 'this.push()'
 * Node just calls _read() until internal buffer is full
 * works fine with both 'data' and 'readable' consumer
 * Node respects highWaterMark, by stopping calling _read()
 */

/**
 * EAGER PRODUCER
 * on first _read() repeats 'this.push()' until internal buffer is full
 * works fine with both 'data' and 'readable' consumer
 * highWaterMark limits amount of pushed data, by returning 'false' from 'this.push()'
 */

/**
 * ASYNC PRODUCER
 * on _read() does not immediately 'this.push()' the chunk
 * Node will NOT call _read() again, until 'this.push()' invoked
 * On next 'this.push()', Node will immediately call _read() again
 * In LAZY-ASYNC this is ok (pushes chunks one-by-one after every _read())
 * In EAGER-ASYNC, special guard value should be used
 */

describe('[ readable / consumer ]', () => {
  /**
   * PUSH CONSUMER
   * for every 'this.push()', there will be 'data' event, giving corresponding chunk
   * Balanced behavior
   * Good for any type of data
   * Best for 'object-mode'
   */

  /**
   * for every single 'push' one 'data' event
   */
  it('[ lazy-sync-readable / push-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: false, log: logReadable })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  it('[ lazy-async-readable / push-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: false, delayMs: 10, log: logReadable })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  /**
     * allows several 'push'es up to highWaterMark
     * then begins sending 'data' event
     * number of 'data' equals number of 'push'
     */
  it('[ eager-sync-readable / push-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8', highWaterMark: 32 })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  /**
     * for every EAGER 'push' there is synchronous 'data' event
     * highWaterMark is not needed
     */
  it('[ eager-async-readable / push-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, delayMs: 20, log: logReadable })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq(
      Array.from(data).map((v) => [v])
    )
    expect(numEvents(stream)).eq(0)
  })

  /**
   * EAGER PULL CONSUMER
   * On 'readable' event starts 'stream.read()' until there is no data left
   * every 'stream.read()' invokes 'readable.read()',
   * and if stream is lazy, it returns chunk, so 'stream.read()' immediately returns that chunk
   * This forces stream to give all its data, one-by-one
   * Then series of 'readable' events continues to be emitted from stream
   * Then stream 'ends'
   * Bad, not optimal
   */
  it('[ eager-sync-readable / eager-sync-pull-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8', highWaterMark: 64 })(data)
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([
      [Array.from(data).join('')],
    ])
    expect(numEvents(stream)).eq(0)
  })

  /**
   * EAGER ASYNC PULL CONSUMER
   */
  it('[ eager-sync-readable / eager-async-pull-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8', highWaterMark: 64 })(data)
    const subscribeConsumer = pullConsumer({ eager: true, delayMs: 10, log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([
      [Array.from(data).join('')],
    ])
    expect(numEvents(stream)).eq(0)
  })

  /**
   * LAZY PULL CONSUMER
   * On 'readable' event makes one 'stream.read'
   * Allows buffered data to arrive in one large chunk
   * Good for concatenatable data (strings, buffers)
   * Bad for 'object-mode', stream never ends
   */
  it('[ eager-sync-readable / lazy-sync-pull-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pullConsumer({ eager: false, log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([
      [Array.from(data).join('')],
    ])
    expect(numEvents(stream)).eq(0)
  })

  /**
   * LAZY ASYNC PULL CONSUMER
   * 'readable' event arrives immediately after first 'this.push()'
   * Consuming this chunk, with stream.read(),
   * means stream becomes empty, and you wait for the next 'readable'
   * You can postpone stream.read(), allowing stream to fill its buffer
   * highWaterMark works perfectly here, affects 'readable' event count
   * Best for concatenatable data (strings, buffers)
   * Bad for 'object-mode', stream never ends
   */
  it('[ eager-sync-readable / lazy-async-pull-consumer ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pullConsumer({ eager: false, delayMs: 10, log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([
      [Array.from(data).join('')],
    ])
    expect(numEvents(stream)).eq(0)
  })

  it('[ \'null\' value is being converted to undefined ]', async () => {
    const data = [null, null]
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ objectMode: true })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([
      [undefined],
      [undefined],
    ])
    expect(numEvents(stream)).eq(0)
  })

  it('[ push-consumer - readable error break ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable, errorAtStep: 0 })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(numEvents(stream)).eq(0)
  })

  it('[ push-consumer - readable error continue ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable, errorAtStep: 0 })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer, continueOnError: true })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(numEvents(stream)).eq(0)
  })

  it('[ pull-consumer - readable error break ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable, errorAtStep: 0 })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream)

    subscribeConsumer()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(numEvents(stream)).eq(0)
  })

  it('[ push-consumer - unsubscribe ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream)

    const unsub = subscribeConsumer()
    unsub()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(numEvents(stream)).eq(0)
  })

  it('[ pull-consumer - unsubscribe ]', async () => {
    const data = makeStrings(8)
    const spy = createSpy(debug('nst-sink: '))
    const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8' })(data)
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream)

    const unsub = subscribeConsumer()
    unsub()

    await finished(stream)

    expect(getSpyCalls(spy)).deep.eq([])
    expect(numEvents(stream)).eq(0)
  })
})

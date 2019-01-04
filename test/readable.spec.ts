import debug from 'debug'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createSpy, getSpyCalls } from 'spyfn'
import { waitTimePromise as wait } from '@psxcode/wait'
import readable from '../src/readable'
import makeStrings from '../src/make-strings'
import dataConsumer from '../src/data-consumer'
import readableConsumer from '../src/readable-consumer'
import waitForEvents from '../src/wait-for-events'

const logReadable = debug('nst-readable')
const logConsumer = debug('nst-consumer')

/**
 * LAZY-PRODUCER
 * on every _read() pushes one chunk with 'this.push()'
 * Node just calls _read() until internal buffer is full
 * works fine with both 'data' and 'readable' consumer
 * Node respects highWaterMark, by stopping calling _read()
 */

/**
 * EAGER-PRODUCER
 * on first _read() repeats 'this.push()' until internal buffer is full
 * works fine with both 'data' and 'readable' consumer
 * highWaterMark limits amount of pushed data, by returning 'false' from 'this.push()'
 */

/**
 * ASYNC-PRODUCER
 * on _read() does not immediately 'this.push()' the chunk
 * Node will NOT call _read() again, until 'this.push()' invoked
 * On next 'this.push()', Node will immediately call _read() again
 * In LAZY-ASYNC this is ok (pushes chunks one-by-one after every _read())
 * In EAGER-ASYNC, special guard value should be used
 */

describe('[ stream-test / readable ]', function () {
  this.slow(1000)

  /**
   * DATA CONSUMER
   * for every 'this.push()', there will be 'data' event giving corresponding chunk
   * Balanced behavior
   * Good for any type of data
   * Best for 'object-mode'
   */
  describe('[ data consumer ]', () => {
    /**
     * for every single 'push' one 'data' event
     */
    describe('[ LAZY-SYNC-PRODUCER ]', () => {
      it('shoudl work', async () => {
        const data = makeStrings(8)
        const spy = createSpy(debug('nst-readable-test: '))
        const stream = readable({ eager: false, log: logReadable })({ encoding: 'utf8' })(data)
        const consumer = dataConsumer({ log: logConsumer })(spy)

        consumer(stream)

        await waitForEvents('end', 'error')(stream)
        await wait(20)

        expect(Array.from(data).map((v) => [v])).deep.eq(getSpyCalls(spy))
      })
    })

    /**
     * allows several 'push'es up to highWaterMark
     * then begins sending 'data' event
     * number os 'data' equals number of 'push'
     */
    describe('[ EAGER-SYNC-PRODUCER ]', () => {
      it('should work', async () => {
        const data = makeStrings(8)
        const spy = createSpy(debug('nst-readable-test: '))
        const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8', highWaterMark: 64 })(data)
        const consumer = dataConsumer({ log: logConsumer })(spy)

        consumer(stream)

        await waitForEvents('end', 'error')(stream)
        await wait(20)

        expect(Array.from(data).map((v) => [v])).deep.eq(getSpyCalls(spy))
      })
    })

    /**
     * for every EAGER 'push' there is synchronous 'data' event
     * highWaterMark is not needed
     */

    describe.only('[ EAGER-ASYNC-PRODUCER ]', () => {
      it('should work', async () => {
        const data = makeStrings(8)
        const spy = createSpy(debug('nst-readable-test: '))
        const stream = readable({ eager: true, delayMs: 20, log: logReadable })({ encoding: 'utf8' })(data)
        const consumer = dataConsumer({ log: logConsumer })(spy)

        consumer(stream)

        await waitForEvents('end', 'error')(stream)
        await wait(20)

        expect(Array.from(data)).deep.eq(getSpyCalls(spy))
      })
    })
  })

  /**
   * EAGER-READABLE CONSUMER
   * On 'readable' event starts 'stream.read()' until there is no data left
   * every 'stream.read()' invokes 'readable.read()',
   * and if stream is lazy, it returns chunk, so 'stream.read()' immediately returns that chunk
   * This forces stream to give all its data, one-by-one
   * Then series of 'readable' events continues to be emitted from stream
   * Then stream 'ends'
   * Bad, not optimal
   */
  describe('[ eager-readable consumer ]', () => {
    describe('[ EAGER-SYNC-PRODUCER ]', () => {
      it('should work', async () => {
        const data = makeStrings(8)
        const spy = createSpy(debug('nst-readable-test: '))
        const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8', highWaterMark: 64 })(data)
        const consumer = readableConsumer({ eager: true, log: logConsumer })(spy)

        consumer(stream)

        await waitForEvents('end', 'error')(stream)
        await wait(20)

        expect(Array.from(data).map((v) => [v])).deep.eq(getSpyCalls(spy))
      })
    })
  })

  /**
   * LAZY-READABLE CONSUMER
   * On 'readable' event makes one 'stream.read'
   * Allows buffered data to arrive in one large chunk
   * Good for concatenatable data (strings, buffers)
   * Bad for 'object-mode', stream never ends
   */
  describe('[ lazy-readable consumer ]', () => {
    describe('[ EAGER-SYNC-PRODUCER ]', () => {
      it('should work', async () => {
        const data = makeStrings(8)
        const spy = createSpy(debug('nst-readable-test: '))
        const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8' })(data)
        const consumer = readableConsumer({ log: logConsumer })(spy)

        consumer(stream)

        await waitForEvents('end', 'error')(stream)
        await wait(20)

        expect(Array.from(data).map((v) => [v])).deep.eq(getSpyCalls(spy))
      })
    })
  })

  /**
   * LAZY-ASYNC-READABLE CONSUMER
   * 'readable' event arrives immediately after first 'this.push()'
   * Consuming this chunk, with stream.read(),
   * means stream becomes empty, and you wait for the next 'readable'
   * You can postpone stream.read(), allowing stream to fill its buffer
   * highWaterMark works perfectly here, affects 'readable' event count
   * Best for concatenatable data (strings, buffers)
   * Bad for 'object-mode', stream never ends
   */
  describe('[ lazy-async-readable consumer ]', () => {
    describe('[ EAGER-SYNC-PRODUCER ]', () => {
      it('should work', async () => {
        const data = makeStrings(8)
        const spy = createSpy(debug('nst-readable-test: '))
        const stream = readable({ eager: true, log: logReadable })({ encoding: 'utf8' })(data)
        const consumer = readableConsumer({ delayMs: 0, log: logConsumer })(spy)

        consumer(stream)

        await waitForEvents('end', 'error')(stream)
        await wait(20)

        expect(Array.from(data).map((v) => [v])).deep.eq(getSpyCalls(spy))
      })
    })
  })
})

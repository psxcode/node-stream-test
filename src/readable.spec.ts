import debug from 'debug'
import readable from './readable'
import readableTest from './readable-test'
import makeStrings from './make-strings'
import dataConsumer from './data-consumer'
import readableConsumer from './readable-consumer'
import expectSameCallCount from './expect-same-call-count'
import expectSameData from './expect-same-data'

const logProducer = debug('producer')
const logConsumer = debug('consumer')

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
    xdescribe('[ LAZY-SYNC-PRODUCER ]', () => {
      readableTest(makeStrings(8),
        (data) => readable({ log: logProducer })({ encoding: 'utf8' })(data),
        dataConsumer({ log: logConsumer }),
        expectSameCallCount)
    })

    /**
     * allows several 'push'es up to highWaterMark
     * then begins sending 'data' event
     * number os 'data' equals number of 'push'
     */
    xdescribe('[ EAGER-SYNC-PRODUCER ]', () => {
      readableTest(makeStrings(8),
        (data) => readable({ eager: true, log: logProducer })({ encoding: 'utf8', highWaterMark: 64 })(data),
        dataConsumer({ log: logConsumer }),
        expectSameCallCount)
    })

    /**
     * for every EAGER 'push' there is synchronous 'data' event
     * highWaterMark is not needed
     */

    xdescribe('[ EAGER-ASYNC-PRODUCER ]', () => {
      readableTest(makeStrings(8),
        (data) => readable({ eager: true, delayMs: 20, log: logProducer })({ encoding: 'utf8' })(data),
        dataConsumer({ log: logConsumer }),
        expectSameCallCount)
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
    /* EAGER-SYNC-PRODUCER */
    readableTest(makeStrings(8),
      (data) => readable({ eager: true, log: logProducer })({ encoding: 'utf8', highWaterMark: 64 })(data),
      (stream, spy) => readableConsumer({ eager: true, log: logConsumer })(stream, spy),
      expectSameData)
  })

  /**
   * LAZY-READABLE CONSUMER
   * On 'readable' event makes one 'stream.read'
   * Allows buffered data to arrive in one large chunk
   * Good for concatenatable data (strings, buffers)
   * Bad for 'object-mode', stream never ends
   */
  describe('[ lazy-readable consumer ]', () => {
    xdescribe('[ EAGER-SYNC-PRODUCER ]', () => {
      readableTest(makeStrings(8),
        (data) => readable({ eager: true, log: logProducer })({ encoding: 'utf8' })(data),
        (stream, spy) => readableConsumer({ log: logConsumer })(stream, spy),
        expectSameData)
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
    xdescribe('[ EAGER-SYNC-PRODUCER ]', () => {
      readableTest(makeStrings(8),
        (data) => readable({ eager: true, log: logProducer })({ encoding: 'utf8' })(data),
        (stream, spy) => readableConsumer({ delayMs: 0, log: logConsumer })(stream, spy),
        expectSameData)
    })
  })
})

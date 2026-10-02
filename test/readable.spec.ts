import type { Readable } from "node:stream";
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { fn } from "./spy.ts";
import { debug } from "./debug.ts";
import { readable } from "../src/readable.ts";
import { pushConsumer } from "../src/push-consumer.ts";
import { pullConsumer } from "../src/pull-consumer.ts";
import { streamFinished as finished } from "./stream-finished.ts";
import { numEvents } from "./num-events.ts";
import { makeStrings } from "./make-strings.ts";
import { makeNumbers } from "./make-numbers.ts";

const logReadable = debug("nst:readable");
const logConsumer = debug("nst:consumer");
const destroyFn = (stream: Readable) => () => stream.destroy();

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

describe("[ readable / push-consumer ]", () => {
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
  it("[ lazy-sync-readable / push-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: false, log: logReadable })({ encoding: "utf8" })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy-async-readable / push-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: false, delayMs: 10, log: logReadable })({ encoding: "utf8" })(
      data,
    );
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  /**
   * allows several 'push'es up to highWaterMark
   * then begins sending 'data' event
   * number of 'data' equals number of 'push'
   */
  it("[ eager-sync-readable / push-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({
      encoding: "utf8",
      highWaterMark: 32,
    })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  /**
   * for every EAGER 'push' there is synchronous 'data' event
   * highWaterMark is not needed
   */
  it("[ eager-async-readable / push-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, delayMs: 20, log: logReadable })({ encoding: "utf8" })(
      data,
    );
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ 'null' value is being converted to undefined ]", async () => {
    const data = [null, null];
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({ objectMode: true })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[undefined], [undefined]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error break / push-consumer - error break ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable, errorAtStep: 2 })({
      encoding: "utf8",
    })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error continue / push-consumer - error break ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({
      eager: true,
      log: logReadable,
      errorAtStep: 2,
      continueOnError: true,
    })({ encoding: "utf8" })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error break / push-consumer - error continue ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable, errorAtStep: 2 })({
      encoding: "utf8",
    })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer, continueOnError: true })(spy)(
      stream,
    );

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([["#0000000"], ["#0000001"]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error continue / push-consumer - error continue ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({
      eager: true,
      log: logReadable,
      errorAtStep: 2,
      continueOnError: true,
    })({ encoding: "utf8" })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer, continueOnError: true })(spy)(
      stream,
    );

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable / push-consumer - unsubscribe ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({ encoding: "utf8" })(data);
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    const unsub = subscribeConsumer();
    unsub();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - destroy / push-consumer ]", async () => {
    const data = makeNumbers(4);
    const stream = readable({ eager: true, log: logReadable })({ objectMode: true })(data);
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[0], [1], [2], [3]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy-async-readable - destroy / push-consumer ]", async () => {
    const data = makeNumbers(4);
    const stream = readable({ eager: false, delayMs: 10, log: logReadable })({ objectMode: true })(
      data,
    );
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[0]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy-sync-readable - empty / push-consumer ]", async () => {
    const data = makeNumbers(0);
    const stream = readable({ eager: false, log: logReadable })({ objectMode: true })(data);
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy-async-readable - empty / push-consumer ]", async () => {
    const data = makeNumbers(0);
    const stream = readable({ eager: false, delayMs: 10, log: logReadable })({ objectMode: true })(
      data,
    );
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - empty / push-consumer ]", async () => {
    const data = makeNumbers(0);
    const stream = readable({ eager: true, log: logReadable })({ objectMode: true })(data);
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-async-readable - empty / push-consumer ]", async () => {
    const data = makeNumbers(0);
    const stream = readable({ eager: true, delayMs: 10, log: logReadable })({ objectMode: true })(
      data,
    );
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pushConsumer({ log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });
});

describe("[ readable / pull-consumer ]", () => {
  it("[ eager-sync-readable / eager-sync-pull-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({
      encoding: "utf8",
      highWaterMark: 64,
    })(data);
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[Array.from(data).join("")]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable / eager-async-pull-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({
      encoding: "utf8",
      highWaterMark: 64,
    })(data);
    const subscribeConsumer = pullConsumer({ eager: true, delayMs: 10, log: logConsumer })(spy)(
      stream,
    );

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[Array.from(data).join("")]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable / lazy-sync-pull-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({ encoding: "utf8" })(data);
    const subscribeConsumer = pullConsumer({ eager: false, log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[Array.from(data).join("")]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable / lazy-async-pull-consumer ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({ encoding: "utf8" })(data);
    const subscribeConsumer = pullConsumer({ eager: false, delayMs: 10, log: logConsumer })(spy)(
      stream,
    );

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[Array.from(data).join("")]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error break / pull-consumer - error break ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable, errorAtStep: 0 })({
      encoding: "utf8",
    })(data);
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error continue / pull-consumer - error break ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({
      eager: true,
      log: logReadable,
      errorAtStep: 0,
      continueOnError: true,
    })({ encoding: "utf8" })(data);
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error break / pull-consumer - error continue ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable, errorAtStep: 0 })({
      encoding: "utf8",
    })(data);
    const subscribeConsumer = pullConsumer({
      eager: true,
      log: logConsumer,
      continueOnError: true,
    })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - error continue / pull-consumer - error continue ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({
      eager: true,
      log: logReadable,
      errorAtStep: 0,
      continueOnError: true,
    })({ encoding: "utf8" })(data);
    const subscribeConsumer = pullConsumer({
      eager: true,
      log: logConsumer,
      continueOnError: true,
    })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[Array.from(data).join("")]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable / pull-consumer - unsubscribe ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = readable({ eager: true, log: logReadable })({ encoding: "utf8" })(data);
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream);

    const unsub = subscribeConsumer();
    unsub();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager-sync-readable - destroy / eager-pull-consumer ]", async () => {
    const data = makeNumbers(4);
    const stream = readable({ eager: true, log: logReadable })({ objectMode: true })(data);
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[0], [1], [2], [3]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy-async-readable - destroy / eager-pull-consumer ]", async () => {
    const data = makeNumbers(4);
    const stream = readable({ eager: false, delayMs: 10, log: logReadable })({ objectMode: true })(
      data,
    );
    const spy = fn(destroyFn(stream));
    const subscribeConsumer = pullConsumer({ eager: true, log: logConsumer })(spy)(stream);

    subscribeConsumer();

    await finished(stream);

    expect(spy.calls).deep.eq([[0]]);
    expect(numEvents(stream)).eq(0);
  });
});

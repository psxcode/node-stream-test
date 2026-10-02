import { Writable } from "node:stream";
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { fn } from "./spy.ts";
import { debug } from "./debug.ts";
import { producer } from "../src/producer.ts";
import { writable } from "../src/writable.ts";
import { makeStrings } from "./make-strings.ts";
import { numEvents } from "./num-events.ts";
import { streamFinished as finished } from "./stream-finished.ts";

describe("[ producer / writable ]", () => {
  it("[ eager producer / sync writable ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ log: debug("nst:writable") })({ decodeStrings: false })(spy);
    const beginProducing = producer({ eager: true, log: debug("nst:producer") })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy producer / sync writable ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ log: debug("nst:writable") })({ decodeStrings: false })(spy);
    const beginProducing = producer({ eager: false, log: debug("nst:producer") })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager producer / async writable ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ delayMs: 10, log: debug("nst:writable") })({
      highWaterMark: 16,
      decodeStrings: false,
    })(spy);
    const beginProducing = producer({ eager: true, log: debug("nst:producer") })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy producer / async writable ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ delayMs: 10, log: debug("nst:writable") })({
      highWaterMark: 16,
      decodeStrings: false,
    })(spy);
    const beginProducing = producer({ eager: false, log: debug("nst:producer") })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager producer - unsubscribe ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ log: debug("nst:writable") })({ decodeStrings: false })(spy);
    const beginProducing = producer({ eager: true, log: debug("nst:producer") })(data)(stream);

    const unsub = beginProducing();
    unsub();

    await finished(stream);

    expect(spy.calls).deep.eq([]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager producer - break on error ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ log: debug("nst:writable"), errorAtStep: 0 })({
      decodeStrings: false,
    })(spy);
    const beginProducing = producer({ eager: true, log: debug("nst:producer") })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq([[Array.from(data)[0]]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ eager producer - continue on error ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ log: debug("nst:writable"), errorAtStep: 0 })({
      decodeStrings: false,
    })(spy);
    const beginProducing = producer({
      eager: true,
      log: debug("nst:producer"),
      continueOnError: true,
    })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy producer - break on error ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ log: debug("nst:writable"), errorAtStep: 0 })({
      decodeStrings: false,
    })(spy);
    const beginProducing = producer({ eager: false, log: debug("nst:producer") })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq([[Array.from(data)[0]]]);
    expect(numEvents(stream)).eq(0);
  });

  it("[ lazy producer - write callback error ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const sink = new Writable({
      decodeStrings: false,
      write(chunk, _encoding, cb) {
        spy(chunk);
        cb(new Error("write failed"));
      },
    });
    const beginProducing = producer({ eager: false, log: debug("nst:producer") })(data)(sink);

    beginProducing();

    await finished(sink);

    expect(spy.calls).deep.eq([[Array.from(data)[0]]]);
    expect(numEvents(sink)).eq(0);
  });

  it("[ lazy producer - continue on error ]", async () => {
    const data = makeStrings(8);
    const spy = fn();
    const stream = writable({ log: debug("nst:writable"), errorAtStep: 0 })({
      decodeStrings: false,
    })(spy);
    const beginProducing = producer({
      eager: false,
      log: debug("nst:producer"),
      continueOnError: true,
    })(data)(stream);

    beginProducing();

    await finished(stream);

    expect(spy.calls).deep.eq(Array.from(data).map((v) => [v]));
    expect(numEvents(stream)).eq(0);
  });
});

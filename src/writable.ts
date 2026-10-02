import { Writable } from "node:stream";
import type { WritableOptions } from "node:stream";
import { noop } from "./noop.ts";
import { isPositiveNumber } from "./is-positive-number.ts";

export type MakeWritableOptions = {
  log?: typeof console.log;
  delayMs?: number;
  errorAtStep?: number;
};

export const writable =
  ({ delayMs, errorAtStep, log = noop }: MakeWritableOptions = {}) =>
  (writableOptions: WritableOptions) =>
  (sink: (data: any) => void) => {
    let i = 0;

    const syncHandler = function (
      this: Writable,
      chunk: any,
      _: string,
      cb: (err?: Error) => void,
    ) {
      log("actual write %d", i);
      sink(chunk);
      if (i === errorAtStep) {
        log("emitting error at %d", i);
        this.emit("error", new Error(`error at step ${i}`));
      }
      cb();
      ++i;
    };

    const asyncHandler = function (
      this: Writable,
      chunk: any,
      encoding: string,
      cb: (err?: Error) => void,
    ) {
      log("async write started");
      setTimeout(() => syncHandler.call(this, chunk, encoding, cb), delayMs!);
    };

    const syncFinal = (cb: () => void) => {
      log("final at %d", i);
      cb();
    };

    const asyncFinal = (cb: () => void) => {
      log("async final started");
      setTimeout(() => syncFinal(cb), delayMs!);
    };

    const stream = new Writable({
      ...writableOptions,
      write: isPositiveNumber(delayMs) ? asyncHandler : syncHandler,
      final: isPositiveNumber(delayMs) ? asyncFinal : syncFinal,
    });

    stream.on("removeListener", (name) => {
      log("removeListener for '%s', total: %d", name, stream.listenerCount(name));
    });

    stream.on("newListener", (name) => {
      log("newListener for '%s', total: %d", name, stream.listenerCount(name) + 1);
    });

    return stream;
  };

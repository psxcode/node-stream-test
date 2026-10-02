import { Readable } from "node:stream";
import type { ReadableOptions } from "node:stream";
import { iterate } from "iterama";
import { noop } from "./noop.ts";
import { isPositiveNumber } from "./is-positive-number.ts";
import { waitTime } from "./wait.ts";

export type MakeReadableOptions = {
  log?: typeof console.log;
  errorAtStep?: number;
  continueOnError?: boolean;
  delayMs?: number;
  eager: boolean;
};

export const readable =
  ({ log = noop, errorAtStep, continueOnError = false, eager, delayMs }: MakeReadableOptions) =>
  (readableOptions: ReadableOptions) =>
  (iterable: Iterable<any>) => {
    let unsubscribe: (() => void) | undefined;
    const it = iterate(iterable);
    let i = 0;
    let done = false;

    const push = function (this: Readable): boolean {
      if (i === errorAtStep) {
        log("emitting error at %d", i);
        this.emit("error", new Error(`error at ${i}`));

        if (!continueOnError) {
          log("break on error at %d", i);
          this.push(null);

          return false;
        }
      }

      const iteratorResult = it.next();

      if (done || iteratorResult.done) {
        log("complete at %d", i);
        this.push(null);

        return false;
      }

      log("push %d", i);

      const isOk = this.push(iteratorResult.value !== null ? iteratorResult.value : undefined);

      if (!isOk) {
        log("backpressure at %d", i);
      }

      ++i;

      return isOk;
    };

    const syncHandler = function (this: Readable) {
      if (eager) {
        log("eager read begin at %d", i);
        while (push.call(this)) {}
        log("eager read end at %d", i);
      } else {
        log("lazy read %d", i);
        push.call(this);
      }
    };

    const asyncHandler = function (this: Readable) {
      log("async read started");
      unsubscribe = waitTime(syncHandler.bind(this))(delayMs!);
    };

    const stream = new Readable({
      ...readableOptions,
      read: isPositiveNumber(delayMs) ? asyncHandler : syncHandler,
      destroy(err, cb) {
        if (unsubscribe) {
          unsubscribe();
        }
        this.push(null);
        cb(err);
      },
    });

    stream.on("removeListener", (name) => {
      log("removeListener for '%s', total: %d", name, stream.listenerCount(name));

      if (name === "data" || name === "readable") {
        if (stream.listenerCount("data") === 0 && stream.listenerCount("readable") === 0) {
          log("no more listeners for data - draining data");
          /* when "read" invoked by node, you have to "push" something. Calling "resume" does not work */
          done = true;
          /* in some cases "push(null)" has no effect, but "resume" does */
          setImmediate(() => stream.resume());
        }
      }
    });

    stream.on("newListener", (name) => {
      log("newListener for '%s', total: %d", name, stream.listenerCount(name) + 1);
    });

    return stream;
  };

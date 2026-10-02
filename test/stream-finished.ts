import type { EventEmitter } from "node:events";
import { waitTimePromise } from "./wait.ts";

/*
 * Wait until the stream is fully closed instead of stopping at the first error, so that
 * streams with continueOnError deliver the rest of their data and every listener is removed.
 */
const settle = (stream: EventEmitter) =>
  new Promise<void>((resolve) => {
    const state = stream as any;
    if (state.closed || state.destroyed) return resolve();

    const onError = () => {};
    const onClose = () => {
      stream.removeListener("close", onClose);
      stream.removeListener("error", onError);
      resolve();
    };

    stream.on("close", onClose);
    stream.on("error", onError);
  });

const streamFinished = async (...streams: EventEmitter[]) => {
  await Promise.all(streams.map(settle));
  await waitTimePromise(10);
};

export { streamFinished };

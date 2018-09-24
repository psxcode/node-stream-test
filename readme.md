# Node Stream Test

### Install
```
npm install node-stream-test
```

### Usage

### `readable`
creates test `Readable` stream, simulating `sync`/`async` behaviors
`(options: MakeReadableOptions) => (readableOptions: ReadableOptions) => <T> (iterable: Iterable<T>) => Readable`
```ts
type MakeReadableOptions = {
  log: typeof console.log      // provide debug logger or noop
  delayMs?: number             // simulate async stream behavior
  eager?: boolean              // lazy or eager stream behavior
}
```
> Lazy stream pushes one `chunk` of data on every `read`.  
Eager stream pushes all `chunks` in a synchronous loop on `read`.

> `delayMs` is a delay between `read` call and actual `chunk` push.  
This simulates asynchronous stream behavior.  
If the stream is `eager`, it will push all `chunks` in a loop after first delay
```ts
import { readable } from 'node-stream-test'

// create test-readable stream
const testReadable = readable({
  log: console.log,            // output debug info to console
  delayMs: 10,                 // delay 10ms
  eager: false                 // eager or lazy stream 
})({
  objectMode: true             // provide Node Readable configuration
})(
  [1, 2, 3, 4, 5]              // provide data to stream
)

// subscribe to test-readable
testReadable
  .on('data', () => {})
  .on('end', () => {})
```

### `writable`
creates test `Writable` stream, simulating `sync`/`async` behaviors
`(options: MakeWritableOptions) => (writableOptions: WritableOptions) => <T> (sink: (chunk: T) => void) => Writable`
```ts
type MakeWritableOptions = {
  log: typeof console.log,       // provide debug logger or noop
  delayMs?: number               // simulate async
}
```
> `delayMs` is a delay between `write` call and passing `chunk` to a sink.  
This simulates long async writes.
```ts
import { writable } from 'node-stream-test'

// We have the following stream
declare var stream: ReadableStream

const testWritable = writable({ 
  log: console.log,              // output debug info to console
  delayMs: 10                    // delay 10ms
})({
  objectMode: true               // provide Node Writable configuration
})

// pipe the stream into test-writable
stream.pipe(
  
)
```

### `producer`
writes `chunks` to a stream
`(options: ProducerOptions) => <T> (iterable: Iterable<T>, stream: WritableStream) => () => () => void`
```ts
type ProducerOptions = {
  log: typeof console.log,        // provide debug logger or noop
  eager: boolean                  // eager or lazy producer
}
```
> `eager` producer writes `chunks` in a synchronous loop until `highWatermark` reached.  
`lazy` producer writes one `chunk` on `drain` event.
```ts
import { producer } from 'node-stream-test'

// We have the following writable stream
declare var stream: WritableStream

// create a producer
const beginProduce = producer({
  log: console.log,                // output debug info to console
  eager: true                      // eager producer
})(
  [1, 2, 3, 4, 5],                 // data to write
  0                                // write all data
)(
  stream                           // write to this stream
)
```

### `data-consumer`
simple `on('data')` consumer with logging
`(options: DataConsumerOptions) => <T> (stream: ReadableStream, sink: (chunk: T) => void) => () => void`
```ts
type DataConsumerOptions = {
  log: typeof console.log    // provide debug logger or noop
}
```
```ts
import { dataConsumer } from 'node-stream-test'

// We have the following stream
declare var stream: ReadableStream

dataConsumer({ 
  log: console.log           // output debug info to console
})(
  stream,                    // stream to consume
  (chunk: string) => {}      // your callback on every `data` event
)
```

### `readable-consumer`
simple `on('readable')` consumer with `sync/async` behavior and logging
`(options: ReadableConsumerOptions) => <T> (stream: ReadableStream, sink: (chunk: T) => void) => () => void`
```ts
type ReadableConsumerOptions = {
  log: typeof console.log,       // provide debug logger or noop
  delayMs?: number,              // simulate async
  eager?: boolean,               // eager or lazy behavior
  readSize?: number              // how much data to read on each 'readable' event
}
```
> `delayMs` is a time between `readable` event and actual `read` call on stream.
  
> `eager` consumer calls `read` in synchronous loop until `null` returned.  
Then waits for the next `readable`.  
`lazy` consumer reads one `chunk`, then waits.
```ts
import { readableConsumer } from 'node-stream-test'

// We have the following stream
declare var stream: ReadableStream

readableConsumer({
  log: console.log,                // print debug info to console
  delayMs: 10,                     // delay 10ms
  eager: false,                    // lazy behavior
  readSize: undefined              // read all available data
})(
  stream,                          // stream to consume
  (chunk: string) => {}            // your callback on `read` call, after `readable` event
)
```

### `readable-test`
simple boilerplate to test `Readable` stream. Should be placed inside `describe()`. Creates `it()` test.
```ts
(
  data: Iterable<T>,
  makeReadable: (data: Iterable<T>) => ReadableStream,
  makeConsumer: (stream: ReadableStream, sink: (data: T) => void) => () => void),
  expectFn?: (data: Iterable<T>, spy: SpyFn<T>) => void
) => void
```
```ts
import { readableTest } from 'node-stream-test'

describe('readable test', () => {
  readableTest(
    ['a', 'b', 'c', 'd', 'e'],
    readable({ log: console.log })({ encoding: 'utf8' }),
    dataConsumer({ log: console.log }),
    (data, spy) => expect(data).deep.equals(spy.data)
  )
})
```

### `writable-test`
simple boilerplate to test `Writable` stream. Should be placed inside `describe()`. Creates `it()` test.
```ts
(
  data: Iterable<T>,
  makeWritable: (spy: (data: T) => void) => WritableStream,
  makeProducer: (stream: WritableStream, data: Iterable<T>) => () => void,
  expectFn?: (data: Iterable<T>, spy: SpyFn<T>) => void
) => void
```
```ts
import { writableTest } from 'node-stream-test

describe('writable test', () => {
  writableTest(
    ['a', 'b', 'c', 'd', 'e'],
    writable({ delayMs: 10, log: console.log })({ highWaterMark: 256, decodeStrings: false }),
    producer({ eager: true, log: console.log }),
    (data, spy) => expect(data).deep.equals(spy.data)
  )
})
```

### `transform-test`
simple boilerplate to test `Transform` streams. Should be placed inside `describe()`. Creates `it()` test
```ts
(
  data: Iterable<T>,
  makeReadable: (data: Iterable<T>) => ReadableStream,
  makeWritable: (sink: (data: T) => void) => WritableStream,
  makeTransform: () => ReadableStream | ReadableStream[],
  expectFn?: (data: Iterable<T>, spy: SpyFn<T>) => void
) => void
```

### `SpyFn`
```ts
type SpyFn<T> = {
  (data?: T): void
  callCount (): number
  data (): T[]
}
```

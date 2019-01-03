export type TestRunnerFn = (msg: string, fn: (testObject: any) => any) => any

export type ExpectFn <T> = (testObject: any, originalData: Iterable<T>, spyCalls: any[][]) => void | Promise<void>

export type MakeTransforms = () => NodeJS.ReadWriteStream | NodeJS.ReadWriteStream[]

export type MakeWritable <T> = (sink: (data: T) => void) => NodeJS.WritableStream

export type MakeConsumer <T> = (sink: (data: T) => void) => (stream: NodeJS.ReadableStream) => void

export type MakeProducer <T> = (data: Iterable<T>) => (stream: NodeJS.WritableStream) => void

export type MakeReadable <T> = (data: Iterable<T>) => NodeJS.ReadableStream

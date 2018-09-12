export type SpyFn<T> = {
  (data?: T): void
  callCount (): number
  data (): T[]
}

export const makeSpy = <T> (log: typeof console.log, message: string): SpyFn<T> => {
  let i = 0
  let data: T[] = []
  const spy = (value?: T) => {
    log(message, i, value)
    value != null && data.push(value)
    ++i
  }
  (spy as SpyFn<T>).callCount = () => i;
  (spy as SpyFn<T>).data = () => data
  return (spy as SpyFn<T>)
}

export const makeDataSpy = <T> (log: typeof console.log) =>
  makeSpy<T>(log, 'data:consume %d, value %s')

export const makeErrorSpy = <T> (log: typeof console.log) =>
  makeSpy<T>(log, 'error:event #%d received')

export const makeEndSpy = <T> (log: typeof console.log) =>
  makeSpy<T>(log, 'end:event received')

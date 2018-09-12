import { expect } from 'chai'
import { SpyFn } from './spy'

const expectSameCallCount = (data: Iterable<string>, spy: SpyFn<string>) => {
  const arr = Array.from(data)
  expect(spy.data()).deep.eq(arr)
  expect(spy.callCount()).eq(arr.length)
}

export default expectSameCallCount

import { expect } from 'chai'
import { SpyFn } from './spy'

const concatStrings = (iterable: Iterable<string>) =>
  Array.from(iterable).join('')

const expectSameData = (data: Iterable<string>, spy: SpyFn<string>) => {
  expect(concatStrings(spy.data())).deep.eq(concatStrings(data))
}

export default expectSameData

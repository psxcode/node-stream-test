import { EventEmitter } from 'events'

const numEvents = (ee: EventEmitter) => {
  let num = 0

  num += ee.listenerCount('data')
  num += ee.listenerCount('readable')
  num += ee.listenerCount('error')
  num += ee.listenerCount('end')
  num += ee.listenerCount('finish')
  num += ee.listenerCount('close')

  return num
}

export default numEvents

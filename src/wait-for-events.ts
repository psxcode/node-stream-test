import { EventEmitter } from 'events'

const waitForEvents = (...events: string[]) => (ee: EventEmitter) =>
  new Promise((res) => {
    const onEvent = (value: any) => {
      unsubscribe()
      res(value)
    }
    const unsubscribe = () => events.forEach((e) => ee.removeListener(e, onEvent))
    events.forEach((e) => ee.addListener(e, onEvent))
  })

export default waitForEvents

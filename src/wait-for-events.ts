import { EventEmitter } from 'events'

const waitForEvents = (...events: string[]) => (ee: EventEmitter) =>
  new Promise((resolve, reject) => {
    const onEvent = (value: any) => {
      unsubscribe()
      resolve(value)
    }
    const onError = (err: any) => {
      unsubscribe()
      reject(err)
    }
    const unsubscribe = () => {
      ee.removeListener('error', onError)
      events.forEach((e) => ee.removeListener(e, onEvent))
    }

    /* subscribe */
    if (!events.includes('error')) {
      ee.addListener('error', onError)
    }
    events.forEach((e) => ee.addListener(e, onEvent))
  })

export default waitForEvents

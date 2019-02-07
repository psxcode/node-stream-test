const numEvents = (...ees: NodeJS.EventEmitter[]) => {
  let str = ''

  for (let i = 0; i < ees.length; ++i) {
    const ee = ees[i]
    str += `emitter_${i}\n`
    str += `- data:\t\t${ee.listenerCount('data')}\n`
    str += `- readable:\t${ee.listenerCount('readable')}\n`
    str += `- error:\t${ee.listenerCount('error')}\n`
    str += `- end:\t\t${ee.listenerCount('end')}\n`
    str += `- finish:\t${ee.listenerCount('finish')}\n`
    str += `- close:\t${ee.listenerCount('close')}\n\n`
  }

  return str
}

export default numEvents

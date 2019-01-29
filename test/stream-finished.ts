import { Stream } from 'stream'
import { waitTimePromise } from '@psxcode/wait'

const streamFinished = async (stream: Stream) => {
  await new Promise((resolve) => {
    const unsub = () => {
      stream.removeListener('end', unsub)
      stream.removeListener('finish', unsub)
      stream.removeListener('close', unsub)

      resolve()
    }

    stream.addListener('end', unsub)
    stream.addListener('finish', unsub)
    stream.addListener('close', unsub)
  })

  await waitTimePromise(10)
}

export default streamFinished

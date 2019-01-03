export const pipeStreams = (
  readable: NodeJS.ReadableStream,
  writable: NodeJS.WritableStream,
  ...transforms: NodeJS.ReadWriteStream[]
) => {
  if (!transforms.length) {
    return readable.pipe(writable)
  }

  readable.pipe(transforms[0])
  for (let i = 1; i < transforms.length; ++i) {
    transforms[i - 1].pipe(transforms[i])
  }

  return transforms[transforms.length - 1].pipe(writable)
}

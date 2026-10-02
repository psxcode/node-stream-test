export const waitTime =
  (cb: () => void) =>
  (ms: number): (() => void) => {
    const id = setTimeout(cb, ms);

    return () => clearTimeout(id);
  };

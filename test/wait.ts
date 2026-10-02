export const waitTimePromise = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

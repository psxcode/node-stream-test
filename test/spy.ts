const isError = (obj: any): obj is Error =>
  typeof obj === "object" && typeof obj.stack === "string";

type Spy = ((...args: any[]) => any) & { readonly calls: any[][]; readonly errors: any[][] };

const fn = (impl: (...args: any[]) => any = () => undefined): Spy => {
  const calls: any[][] = [];
  const spy = (...args: any[]) => {
    calls.push(args);
    return impl(...args);
  };
  Object.defineProperty(spy, "calls", {
    configurable: false,
    enumerable: false,
    get: () => calls.slice(),
  });
  Object.defineProperty(spy, "errors", {
    configurable: false,
    enumerable: false,
    get: () => calls.map((c) => (isError(c[0]) ? [c[0].message] : [undefined])),
  });
  return spy as Spy;
};

export { fn };

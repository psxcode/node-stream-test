import { strict as assert } from "node:assert";

const expect = (actual: unknown) => ({
  eq: (expected: unknown) => assert.strictEqual(actual, expected),
  deep: {
    eq: (expected: unknown) => assert.deepStrictEqual(actual, expected),
  },
});

export { expect };

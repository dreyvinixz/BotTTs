const test = require("node:test");
const assert = require("node:assert/strict");
const { weightedChoice, shuffle } = require("../scripts/core/random");

test("weighted choice and shuffle are deterministic with injected rng", () => {
  const items = [{ weight: 1, id: "a" }, { weight: 3, id: "b" }];
  assert.equal(weightedChoice(items, () => 0.1).id, "a");
  assert.equal(weightedChoice(items, () => 0.9).id, "b");
  assert.deepEqual(shuffle([1, 2, 3], () => 0), [2, 3, 1]);
});

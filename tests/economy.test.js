const test = require("node:test");
const assert = require("node:assert/strict");
const economy = require("../scripts/economy/economy");

test("economy keeps balances non-negative and hides test user from ranking", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ a: 100, b: 50, teste_user_id: 9999 });

  assert.equal(economy.addCoins("a", 25), 125);
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(economy.removeCoins("b", 1000), 0);
  } finally {
    console.warn = originalWarn;
  }
  assert.deepEqual(economy.getTopPlayers(5), [{ id: "a", balance: 125 }, { id: "b", balance: 0 }]);
});

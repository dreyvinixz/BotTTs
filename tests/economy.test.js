const test = require("node:test");
const assert = require("node:assert/strict");
const economy = require("../scripts/economy/economy");
const inventory = require("../scripts/economy/inventory");

inventory.__disableSavingForTests(true);

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

test("inventory rejects invalid item amounts and never increases on invalid removal", () => {
  inventory.__setDbForTests({});

  assert.equal(inventory.addItem("u1", "pedra_amolar", 2), true);
  assert.equal(inventory.addItem("u1", "pedra_amolar", 0), false);
  assert.equal(inventory.addItem("u1", "pedra_amolar", -1), false);
  assert.equal(inventory.addItem("u1", "pedra_amolar", 1.5), false);

  assert.equal(inventory.removeItem("u1", "pedra_amolar", -1), false);
  assert.equal(inventory.removeItem("u1", "pedra_amolar", 3), false);
  assert.equal(inventory.hasItem("u1", "pedra_amolar", 2), true);
  assert.equal(inventory.__getDbForTests().u1.items.pedra_amolar, 2);
});

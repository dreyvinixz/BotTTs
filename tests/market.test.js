const test = require("node:test");
const assert = require("node:assert/strict");

const economy = require("../scripts/economy/economy");
const inventory = require("../scripts/economy/inventory");
const weapons = require("../scripts/economy/weapons");
const market = require("../scripts/economy/market");

test("market creates order locks weapon and transfers on buy", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ seller: 0, buyer: 20000 });
  inventory.__setDbForTests({});
  market.__setDbForTests({ orders: [], history: [], trades: [] });

  const instance = weapons.grantWeapon("seller", "espada_madeira");
  const entry = market.sellableEntries("seller").find((item) => item.instanceId === instance.instanceId);
  const created = market.createOrder("seller", entry, 1000);

  assert.equal(created.ok, true);
  assert.equal(inventory.__getDbForTests().seller.weapons[0].lockedUntil > 0, true);

  const bought = market.buyOrder("buyer", created.order.id);
  assert.equal(bought.ok, true);
  assert.equal(economy.getCoins("seller"), 1000);
  assert.equal(weapons.getUserInventory, undefined);
  assert.equal(inventory.__getDbForTests().buyer.weapons.length, 1);
});

test("market UI blocks clicks from another user", async () => {
  const replies = [];
  const handled = await market.handleMarketInteraction({
    isButton: () => true,
    isStringSelectMenu: () => false,
    isModalSubmit: () => false,
    customId: "market_sell_owner",
    user: { id: "other" },
    reply: async (payload) => replies.push(payload)
  });

  assert.equal(handled, true);
  assert.match(replies[0].content, /Bolsa foi aberta/);
});

test("market trade locks item and requires target acceptance", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ seller: 0, buyer: 5000 });
  inventory.__setDbForTests({});
  market.__setDbForTests({ orders: [], history: [], trades: [] });

  const instance = weapons.grantWeapon("seller", "adaga_ferro");
  const entry = market.sellableEntries("seller").find((item) => item.instanceId === instance.instanceId);
  const created = market.createTrade({ proposerId: "seller", targetId: "buyer", entry, price: 1200 });

  assert.equal(created.ok, true);
  assert.equal(inventory.__getDbForTests().seller.weapons[0].lockedUntil > 0, true);

  const accepted = market.acceptTrade("buyer", created.trade.id);
  assert.equal(accepted.ok, true);
  assert.equal(economy.getCoins("seller"), 1200);
  assert.equal(inventory.__getDbForTests().buyer.weapons[0].weaponId, "adaga_ferro");
});

const test = require("node:test");
const assert = require("node:assert/strict");

const economy = require("../scripts/economy/economy");
const inventory = require("../scripts/economy/inventory");
const weapons = require("../scripts/economy/weapons");
const market = require("../scripts/economy/market");
const ledger = require("../scripts/economy/ledger");
const shopStock = require("../scripts/economy/shopStock");
const { repairWeapon } = require("../scripts/economy/forge");

inventory.__disableSavingForTests(true);
market.__disableSavingForTests(true);
ledger.__disableSavingForTests(true);
shopStock.__disableSavingForTests(true);

test("market creates order locks weapon and transfers on buy", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ seller: 0, buyer: 20000 });
  inventory.__setDbForTests({});
  market.__setDbForTests({ orders: [], history: [], trades: [] });
  ledger.__setLedgerForTests([]);

  const instance = weapons.grantWeapon("seller", "espada_madeira");
  const entry = market.sellableEntries("seller").find((item) => item.instanceId === instance.instanceId);
  const created = market.createOrder("seller", entry, 1000);

  assert.equal(created.ok, true);
  assert.equal(inventory.__getDbForTests().seller.weapons[0].lockedUntil > 0, true);

  const bought = market.buyOrder("buyer", created.order.id);
  assert.equal(bought.ok, true);
  assert.equal(economy.getCoins("seller"), 950);
  assert.equal(weapons.getUserInventory, undefined);
  assert.equal(inventory.__getDbForTests().buyer.weapons.length, 1);

  const events = ledger.__getLedgerForTests().map((event) => event.type);
  assert.deepEqual(events, ["market_create_order", "market_buy", "market_fee"]);
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

test("market supports material batch orders cancel and buy with correct amounts", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ seller: 0, buyer: 20000 });
  inventory.__setDbForTests({});
  market.__setDbForTests({ orders: [], history: [], trades: [] });
  ledger.__setLedgerForTests([]);

  inventory.addItem("seller", "pedra_amolar", 10);
  const entry = market.sellableEntries("seller").find((item) => item.itemId === "pedra_amolar");
  entry.amount = 4;

  const created = market.createOrder("seller", entry, 1000);
  assert.equal(created.ok, true);
  assert.equal(inventory.__getDbForTests().seller.items.pedra_amolar, 6);

  const cancelled = market.cancelOrder("seller", created.order.id);
  assert.equal(cancelled.ok, true);
  assert.equal(inventory.__getDbForTests().seller.items.pedra_amolar, 10);
  assert.equal(market.__getDbForTests().orders[0].status, "cancelled");

  entry.amount = 5;
  const createdAgain = market.createOrder("seller", entry, 1000);
  const bought = market.buyOrder("buyer", createdAgain.order.id);

  assert.equal(bought.ok, true);
  assert.equal(inventory.__getDbForTests().seller.items.pedra_amolar, 5);
  assert.equal(inventory.__getDbForTests().buyer.items.pedra_amolar, 5);
  assert.equal(economy.getCoins("seller"), 950);
});

test("system sell increases shop stock and records ledger without using system inventory for materials", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ seller: 0 });
  inventory.__setDbForTests({});
  market.__setDbForTests({ orders: [], history: [], trades: [] });
  ledger.__setLedgerForTests([]);
  shopStock.__setStockForTests({ items: { pedra_amolar: { stock: 1, targetStock: 60, lastUpdated: 0, totalBoughtFromShop: 0, totalSoldToShop: 0 } } });

  inventory.addItem("seller", "pedra_amolar", 3);
  const sold = market.systemSell("seller", { kind: "item", itemId: "pedra_amolar", itemKey: "item:pedra_amolar", amount: 2, basePrice: 350 });

  assert.equal(sold.ok, true);
  assert.equal(inventory.__getDbForTests().seller.items.pedra_amolar, 1);
  assert.equal(inventory.__getDbForTests().system, undefined);
  assert.equal(shopStock.__getStockForTests().items.pedra_amolar.stock, 3);
  assert.equal(ledger.__getLedgerForTests().at(-1).type, "system_sell");
});

test("shop stock never goes negative and dynamic price responds to stock", () => {
  market.__setDbForTests({ orders: [], history: [], trades: [] });
  shopStock.__setStockForTests({ items: { pedra_amolar: { stock: 1, targetStock: 10, lastUpdated: 0, totalBoughtFromShop: 0, totalSoldToShop: 0 } } });

  assert.equal(shopStock.removeStock("pedra_amolar", 99, 10), true);
  assert.equal(shopStock.__getStockForTests().items.pedra_amolar.stock, 0);
  const lowStockPrice = shopStock.getDynamicPrice("pedra_amolar", 100, 50, 200);

  shopStock.__setStockForTests({ items: { pedra_amolar: { stock: 30, targetStock: 10, lastUpdated: 0, totalBoughtFromShop: 0, totalSoldToShop: 0 } } });
  const highStockPrice = shopStock.getDynamicPrice("pedra_amolar", 100, 50, 200);

  assert.ok(lowStockPrice > highStockPrice);
  assert.ok(lowStockPrice <= 200);
  assert.ok(highStockPrice >= 50);
});

test("suggested market price uses real unit prices and ignores system sells", () => {
  market.__setDbForTests({
    orders: [],
    trades: [],
    history: [
      { itemKey: "item:pedra_amolar", entry: { kind: "item", itemId: "pedra_amolar", amount: 10 }, sellerId: "a", buyerId: "b", price: 1000 },
      { itemKey: "item:pedra_amolar", entry: { kind: "item", itemId: "pedra_amolar", amount: 1 }, sellerId: "a", buyerId: "system", price: 999999 }
    ]
  });

  const suggested = market.getSuggestedPrice({ kind: "item", itemId: "pedra_amolar", itemKey: "item:pedra_amolar", basePrice: 100 });
  assert.equal(suggested, 100);
});

test("forge repairs weapon durability with compatible material and blocks locked weapons", () => {
  inventory.__setDbForTests({});
  ledger.__setLedgerForTests([]);

  const instance = weapons.grantWeapon("player", "espada_madeira");
  weapons.consumeWeaponDurability("player", instance.instanceId, 5);
  inventory.addItem("player", "pedra_amolar", 1);

  const repaired = repairWeapon("player", instance.instanceId, "pedra_amolar", 1);
  assert.equal(repaired.ok, true);
  assert.equal(inventory.__getDbForTests().player.items.pedra_amolar, undefined);
  assert.equal(inventory.__getDbForTests().player.weapons[0].durabilityLeft, instance.durabilityLeft);
  assert.equal(ledger.__getLedgerForTests().at(-1).type, "repair_weapon");

  const locked = weapons.grantWeapon("player", "espada_madeira");
  inventory.updateWeaponInstance("player", locked.instanceId, (weapon) => ({ ...weapon, lockedUntil: Date.now() + 1000 }));
  inventory.addItem("player", "pedra_amolar", 1);

  const blocked = repairWeapon("player", locked.instanceId, "pedra_amolar", 1);
  assert.equal(blocked.ok, false);
  assert.match(blocked.reason, /Bolsa/);
});

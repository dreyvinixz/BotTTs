const test = require("node:test");
const assert = require("node:assert/strict");

const economy = require("../scripts/economy/economy");
const inventory = require("../scripts/economy/inventory");
const { handleBoostCommand, handleBoostInteraction } = require("../scripts/economy/boosts");

economy.__disableSavingForTests(true);
inventory.__disableSavingForTests(true);

test("shop no longer exposes direct weapon purchase categories", async () => {
  let payload;
  await handleBoostCommand({
    author: { id: "player" },
    reply: async (nextPayload) => {
      payload = nextPayload;
    }
  });

  const buttonIds = payload.components
    .flatMap((row) => row.toJSON().components)
    .map((component) => component.custom_id);

  assert.ok(!buttonIds.includes("shop_cat_weapons_player"));
  assert.ok(!buttonIds.includes("shop_cat_legendary_player"));
  assert.match(payload.content, /Forja/);
  assert.match(payload.content, /bolsa/);
});

test("legacy weapon select menus do not grant weapons or remove coins", async () => {
  economy.__setDbForTests({ player: 20000 });
  inventory.__setDbForTests({});

  const replies = [];
  await handleBoostInteraction({
    isButton: () => false,
    isStringSelectMenu: () => true,
    customId: "weapon_select_player",
    user: { id: "player" },
    values: ["espada_madeira"],
    reply: async (payload) => replies.push(payload)
  });

  assert.equal(economy.getCoins("player"), 20000);
  assert.equal(inventory.__getDbForTests().player?.weapons?.length || 0, 0);
  assert.match(replies[0].content, /compra direta de armas saiu/);
});

test("legacy weapon category buttons are disabled", async () => {
  const replies = [];
  await handleBoostInteraction({
    isButton: () => true,
    isStringSelectMenu: () => false,
    customId: "shop_cat_weapons_player",
    user: { id: "player" },
    reply: async (payload) => replies.push(payload)
  });

  assert.match(replies[0].content, /compra direta de armas saiu/);
});

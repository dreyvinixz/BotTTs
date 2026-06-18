const test = require("node:test");
const assert = require("node:assert/strict");

const inventory = require("../scripts/economy/inventory");
const weapons = require("../scripts/economy/weapons");

inventory.__disableSavingForTests(true);

test("weapon instances can be granted equipped and consumed", () => {
  inventory.__setDbForTests({});
  const instance = weapons.grantWeapon("u1", "espada_madeira");

  assert.ok(instance.instanceId);
  assert.equal(weapons.equipWeapon("u1", instance.instanceId), true);
  assert.equal(weapons.getEquippedWeapon("u1").weaponId, "espada_madeira");

  weapons.consumeWeaponDurability("u1", instance.instanceId, 99);
  assert.equal(weapons.getEquippedWeapon("u1"), null);
});

test("legendary weapons expose ability data and boss damage modifiers", () => {
  inventory.__setDbForTests({});
  const instance = weapons.grantWeapon("u1", "espada_gelo");
  const equipped = weapons.getEquippedWeapon("u1");
  const result = weapons.computeBossWeaponDamage(
    equipped,
    { id: "final", weakness: "espada", weaknessMultiplier: 1.4 },
    { weaponMultiplier: 1 },
    () => 0
  );

  assert.equal(result.ability.id, "freeze_boss");
  assert.ok(result.damage > equipped.def.bossDamage);
});

test("inventory command can redraw from an interaction user", async () => {
  inventory.__setDbForTests({});
  let payload;

  await weapons.handleInventoryCommand({
    user: { id: "u1", username: "Tester" },
    update: async (nextPayload) => {
      payload = nextPayload;
    }
  });

  assert.equal(payload.embeds[0].data.title, "🎒 Inventário de Tester");
  assert.equal(payload.components[0].components[0].data.custom_id, "open_forge_menu");
});

const test = require("node:test");
const assert = require("node:assert/strict");

const inventory = require("../scripts/economy/inventory");
const weapons = require("../scripts/economy/weapons");

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

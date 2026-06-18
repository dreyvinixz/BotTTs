const test = require("node:test");
const assert = require("node:assert/strict");

const economy = require("../scripts/economy/economy");
const inventory = require("../scripts/economy/inventory");
const weapons = require("../scripts/economy/weapons");
const ledger = require("../scripts/economy/ledger");
const config = require("../scripts/core/config");
const activeEffects = require("../scripts/economy/activeEffects");
const {
  fortifyWeapon,
  craftWeapon,
  rerollLegendaryAbility
} = require("../scripts/economy/forge");
const boss = require("../scripts/games/boss");

inventory.__disableSavingForTests(true);
ledger.__disableSavingForTests(true);
activeEffects.__disableSavingForTests(true);

test("fortification consumes materials, records success and failure, and blocks max level", () => {
  economy.__disableSavingForTests(true);
  inventory.__setDbForTests({});
  ledger.__setLedgerForTests([]);

  const instance = weapons.grantWeapon("player", "espada_madeira");
  inventory.addItem("player", "pedra_amolar", 6);

  const success = fortifyWeapon("player", instance.instanceId, () => 0);
  assert.equal(success.ok, true);
  assert.equal(success.success, true);
  assert.equal(inventory.__getDbForTests().player.weapons[0].fortifyLevel, 1);
  assert.equal(inventory.__getDbForTests().player.items.pedra_amolar, 4);

  const failure = fortifyWeapon("player", instance.instanceId, () => 0.99);
  assert.equal(failure.ok, true);
  assert.equal(failure.success, false);
  assert.equal(inventory.__getDbForTests().player.weapons[0].fortifyLevel, 1);
  assert.equal(inventory.__getDbForTests().player.items.pedra_amolar, 2);

  inventory.updateWeaponInstance("player", instance.instanceId, (weapon) => ({ ...weapon, fortifyLevel: 5 }));
  const blocked = fortifyWeapon("player", instance.instanceId, () => 0);
  assert.equal(blocked.ok, false);
  assert.match(blocked.reason, /máximo/);

  const events = ledger.__getLedgerForTests().filter((event) => event.type === "fortify_weapon");
  assert.equal(events.length, 2);
  assert.deepEqual(events.map((event) => event.success), [true, false]);
});

test("fortified weapons affect boss and duel stats", () => {
  inventory.__setDbForTests({});
  const instance = weapons.grantWeapon("player", "espada_madeira");
  inventory.updateWeaponInstance("player", instance.instanceId, (weapon) => ({ ...weapon, fortifyLevel: 5 }));
  const equipped = weapons.getEquippedWeapon("player");

  const bossDamage = weapons.computeBossWeaponDamage(
    equipped,
    { id: "inicio", weakness: "none", resistance: "none" },
    { weaponMultiplier: 1 },
    () => 0.99
  );
  const duelPower = weapons.computeDuelWeaponModifier(equipped, "Ataque", () => 0.99);

  assert.equal(bossDamage.damage, Math.floor(equipped.def.bossDamage * 1.25));
  assert.equal(duelPower.power, Math.floor(equipped.def.duelPower * 1.25));
});

test("combat buffs are persisted by category and expire after category use", () => {
  inventory.__setDbForTests({});
  activeEffects.__setDbForTests({});
  activeEffects.__disableSavingForTests(true);
  ledger.__setLedgerForTests([]);

  inventory.addItem("player", "essencia_rara", 1);
  inventory.addItem("player", "fragmento_mana", 1);

  const bossBuff = activeEffects.useCombatBuff("player", "essencia_rara");
  const duelBuff = activeEffects.useCombatBuff("player", "fragmento_mana");

  assert.equal(bossBuff.ok, true);
  assert.equal(duelBuff.ok, true);
  assert.equal(activeEffects.getActiveBuff("player", "boss").bossDamageBonus, 0.25);
  assert.equal(activeEffects.getActiveBuff("player", "duel").duelPowerBonus, 5);
  assert.equal(inventory.__getDbForTests().player.items.essencia_rara, undefined);
  assert.equal(inventory.__getDbForTests().player.items.fragmento_mana, undefined);

  activeEffects.decrementBuff("player", "boss");
  assert.equal(activeEffects.getActiveBuff("player", "boss"), null);
  assert.equal(activeEffects.getActiveBuff("player", "duel").duelPowerBonus, 5);

  assert.equal(ledger.__getLedgerForTests().filter((event) => event.type === "combat_buff_used").length, 2);
});

test("crafting consumes coins and materials and creates an unfortified weapon", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ crafter: 1000, legendaryCrafter: 20000 });
  inventory.__setDbForTests({});
  ledger.__setLedgerForTests([]);

  inventory.addItem("crafter", "pedra_amolar", 5);

  const crafted = craftWeapon("crafter", "espada_madeira");
  assert.equal(crafted.ok, true);
  assert.equal(economy.getCoins("crafter"), 700);
  assert.equal(inventory.__getDbForTests().crafter.items.pedra_amolar, undefined);
  assert.equal(inventory.__getDbForTests().crafter.weapons[0].weaponId, "espada_madeira");
  assert.equal(inventory.__getDbForTests().crafter.weapons[0].fortifyLevel, 0);
  assert.equal(ledger.__getLedgerForTests().at(-1).type, "craft_weapon");

  inventory.addItem("legendaryCrafter", "essencia_rara", 6);
  inventory.addItem("legendaryCrafter", "nucleo_lendario", 2);
  const legendary = craftWeapon("legendaryCrafter", "espada_gelo");
  assert.equal(legendary.ok, true);
  assert.equal(inventory.__getDbForTests().legendaryCrafter.weapons[0].weaponId, "espada_gelo");

  const originalWeapon = config.static.weapons.weapons.temp_lendaria_bloqueada;
  const originalRecipe = config.static.weapons.crafting.temp_lendaria_bloqueada;
  try {
    config.static.weapons.weapons.temp_lendaria_bloqueada = {
      name: "Lendaria Bloqueada",
      class: "espada",
      rarity: "lendario",
      basePrice: 9999,
      durability: 10,
      bossDamage: 1,
      duelPower: 1
    };
    config.static.weapons.crafting.temp_lendaria_bloqueada = {
      cost: 1,
      materials: []
    };
    const blocked = craftWeapon("legendaryCrafter", "temp_lendaria_bloqueada");
    assert.equal(blocked.ok, false);
    assert.match(blocked.reason, /lendárias/);
  } finally {
    if (originalWeapon === undefined) delete config.static.weapons.weapons.temp_lendaria_bloqueada;
    else config.static.weapons.weapons.temp_lendaria_bloqueada = originalWeapon;
    if (originalRecipe === undefined) delete config.static.weapons.crafting.temp_lendaria_bloqueada;
    else config.static.weapons.crafting.temp_lendaria_bloqueada = originalRecipe;
  }

  const blocked = craftWeapon("crafter", "arma_sem_receita");
  assert.equal(blocked.ok, false);
});

test("legendary reroll consumes nuclei and replaces chance inside configured range", () => {
  inventory.__setDbForTests({});
  ledger.__setLedgerForTests([]);

  const instance = weapons.grantWeapon("player", "espada_gelo");
  inventory.addItem("player", "nucleo_lendario", 3);

  const rerolled = rerollLegendaryAbility("player", instance.instanceId, () => 0);
  assert.equal(rerolled.ok, true);
  assert.equal(rerolled.newChance, 0.15);
  assert.equal(inventory.__getDbForTests().player.items.nucleo_lendario, undefined);
  assert.equal(inventory.__getDbForTests().player.weapons[0].abilityChance, 0.15);
  assert.equal(ledger.__getLedgerForTests().at(-1).type, "reroll_legendary");

  const common = weapons.grantWeapon("player", "espada_madeira");
  inventory.addItem("player", "nucleo_lendario", 3);
  const blocked = rerollLegendaryAbility("player", common.instanceId, () => 0);
  assert.equal(blocked.ok, false);
});

test("boss finish keeps coin prizes, grants material drops, and records ledger", async () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ winner: 0, low: 0 });
  inventory.__setDbForTests({});
  ledger.__setLedgerForTests([]);
  activeEffects.__setDbForTests({});
  activeEffects.__disableSavingForTests(true);

  let finalContent = "";
  const fakeInteraction = {
    update: async () => {},
    message: {
      id: "boss-msg",
      edit: async (payload) => {
        finalContent = payload.content;
      }
    }
  };

  await boss.finishBoss(fakeInteraction, {
    type: "mini",
    name: "Mini Boss",
    prize: 5000,
    maxHp: 5000,
    damageDealt: new Map([["winner", 5000], ["low", 0]]),
    timerId: null
  });

  assert.equal(economy.getCoins("winner") > 0, true);
  assert.equal(economy.getCoins("low"), 0);
  assert.equal(Object.values(inventory.__getDbForTests().winner.items).reduce((sum, amount) => sum + amount, 0) > 0, true);
  assert.equal(inventory.__getDbForTests().winner.items.nucleo_lendario, undefined);
  assert.match(finalContent, /ganhou/);
  assert.equal(ledger.__getLedgerForTests().at(-1).type, "boss_material_drop");
});

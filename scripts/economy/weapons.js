const { EmbedBuilder } = require("discord.js");
const config = require("../core/config");
const { weightedChoice } = require("../core/random");
const {
  addWeaponInstance,
  getUserInventory,
  setEquippedWeapon,
  updateWeaponInstance
} = require("./inventory");

const weaponData = config.static.weapons || { weapons: {}, rarities: {}, classes: {} };

function getWeaponDef(weaponId) {
  return weaponData.weapons?.[weaponId] || null;
}

function listWeaponDefs(filter = {}) {
  return Object.entries(weaponData.weapons || {})
    .map(([id, weapon]) => ({ id, ...weapon }))
    .filter((weapon) => filter.rarity ? weapon.rarity === filter.rarity : true)
    .filter((weapon) => filter.class ? weapon.class === filter.class : true)
    .filter((weapon) => filter.shopEnabled === undefined ? true : weapon.shopEnabled === filter.shopEnabled);
}

function createWeaponInstance(weaponId, now = Date.now()) {
  const def = getWeaponDef(weaponId);
  if (!def) return null;
  return {
    instanceId: `wpn_${now}_${Math.floor(Math.random() * 100000)}`,
    weaponId,
    durabilityLeft: def.durability,
    createdAt: now
  };
}

function grantWeapon(userId, weaponId) {
  const instance = createWeaponInstance(weaponId);
  if (!instance) return null;
  addWeaponInstance(userId, instance);
  return instance;
}

function grantRandomWeapon(userId, filter = {}, rng = Math.random) {
  const candidates = listWeaponDefs(filter).map((weapon) => ({
    ...weapon,
    weight: weapon.lootWeight || 1
  }));
  const selected = weightedChoice(candidates, rng);
  if (!selected) return null;
  return grantWeapon(userId, selected.id);
}

function getWeaponInstance(userId, instanceId) {
  return getUserInventory(userId).weapons.find((weapon) => weapon.instanceId === instanceId) || null;
}

function getEquippedWeapon(userId) {
  const inventory = getUserInventory(userId);
  const instance = inventory.weapons.find((weapon) => weapon.instanceId === inventory.equippedWeaponId && !weapon.lockedUntil);
  if (!instance) return null;
  const def = getWeaponDef(instance.weaponId);
  return def ? { ...instance, def } : null;
}

function equipWeapon(userId, instanceId) {
  return setEquippedWeapon(userId, instanceId);
}

function consumeWeaponDurability(userId, instanceId, amount = 1) {
  const updated = updateWeaponInstance(userId, instanceId, (weapon) => {
    const nextDurability = (weapon.durabilityLeft || 0) - amount;
    if (nextDurability <= 0) return null;
    return { ...weapon, durabilityLeft: nextDurability };
  });
  return updated;
}

function rollLegendaryAbility(def, context = {}, rng = Math.random) {
  if (def?.rarity !== "lendario" || !def.ability) return null;
  const chance = Number(def.ability.chance) || 0;
  return rng() < chance ? def.ability : null;
}

function computeBossWeaponDamage(weapon, phase, actionConfig, rng = Math.random) {
  if (!weapon?.def) return { damage: 0, ability: null, durabilityCost: 0 };
  let damage = Number(weapon.def.bossDamage) || 0;
  damage *= Number(actionConfig.weaponMultiplier) || 1;

  if (phase?.weakness === weapon.def.class) damage *= phase.weaknessMultiplier || 1;
  if (phase?.resistance === weapon.def.class) damage *= phase.resistanceMultiplier || 1;

  const ability = rollLegendaryAbility(weapon.def, { phase }, rng);
  if (ability?.bossFinalPhaseMultiplier && phase?.id === "final") {
    damage *= ability.bossFinalPhaseMultiplier;
  }

  return {
    damage: Math.floor(damage),
    ability,
    durabilityCost: 1
  };
}

function computeDuelWeaponModifier(weapon, opponentChoice, rng = Math.random) {
  if (!weapon?.def) {
    return { power: 0, piercesDefense: false, piercesParrudo: false, ability: null, durabilityCost: 0 };
  }

  const ability = rollLegendaryAbility(weapon.def, { opponentChoice }, rng);
  const pierceDefenseChance = (weapon.def.pierceDefenseChance || 0) + (ability?.duelPierceBonus || 0);

  return {
    power: weapon.def.duelPower || 0,
    piercesDefense: opponentChoice === "Defesa" && rng() < pierceDefenseChance,
    piercesParrudo: rng() < (weapon.def.pierceParrudoChance || 0),
    ability,
    durabilityCost: 1
  };
}

function formatWeaponLabel(instanceOrDef) {
  const def = instanceOrDef.def || instanceOrDef;
  const rarity = weaponData.rarities?.[def.rarity]?.label || def.rarity;
  const durability = instanceOrDef.durabilityLeft !== undefined
    ? ` (${instanceOrDef.durabilityLeft}/${def.durability} usos)`
    : "";
  return `${def.name} [${rarity}]${durability}`;
}

async function handleEquipWeaponCommand(message, text) {
  const instanceId = (text || "").trim();
  if (!instanceId) {
    return message.reply("Use `!equipar <id_da_arma>`. Veja seus IDs em `!inventario`.");
  }
  if (!equipWeapon(message.author.id, instanceId)) {
    return message.reply("Não encontrei essa arma no seu inventário, ou ela está travada na Bolsa.");
  }
  const weapon = getEquippedWeapon(message.author.id);
  return message.reply(`✅ Arma equipada: **${formatWeaponLabel(weapon)}**.`);
}

async function handleInventoryCommand(message) {
  const inventory = getUserInventory(message.author.id);
  const itemLines = Object.entries(inventory.items)
    .filter(([, amount]) => amount > 0)
    .map(([itemId, amount]) => `• ${itemId}: x${amount}`);

  const weaponLines = inventory.weapons.map((instance) => {
    const def = getWeaponDef(instance.weaponId);
    const equipped = inventory.equippedWeaponId === instance.instanceId ? " [EQUIPADA]" : "";
    const locked = instance.lockedUntil ? " [BOLSA]" : "";
    return `• ${instance.instanceId}: ${def ? formatWeaponLabel({ ...instance, def }) : instance.weaponId}${equipped}${locked}`;
  });

  const embed = new EmbedBuilder()
    .setColor("#22C55E")
    .setTitle(`🎒 Inventário de ${message.author.username}`)
    .addFields(
      { name: "Itens", value: itemLines.join("\n") || "Nenhum item.", inline: false },
      { name: "Armas", value: weaponLines.slice(0, 15).join("\n") || "Nenhuma arma.", inline: false }
    );

  return message.reply({ embeds: [embed] });
}

module.exports = {
  getWeaponDef,
  listWeaponDefs,
  createWeaponInstance,
  grantWeapon,
  grantRandomWeapon,
  getWeaponInstance,
  getEquippedWeapon,
  equipWeapon,
  consumeWeaponDurability,
  computeBossWeaponDamage,
  computeDuelWeaponModifier,
  formatWeaponLabel,
  handleEquipWeaponCommand,
  handleInventoryCommand
};

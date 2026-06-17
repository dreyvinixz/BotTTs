const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require("discord.js");
const config = require("../core/config");
const { addCoins } = require("../economy/economy");
const { assertForgeReady } = require("../core/services");
const { styleFromName } = require("../core/ui");
const { getEquippedWeapon, consumeWeaponDurability, computeBossWeaponDamage, formatWeaponLabel } = require("../economy/weapons");
const {
  getBossTypeConfig,
  getBossPhase,
  getBossAction,
  computeBossAttackDamage,
  applyDamage,
  computeBossPrizes
} = require("./bossRules");

const activeBosses = new Map();
const bossConfig = config.static.app.boss;

function buildBossRows(messageId) {
  const entries = Object.entries(bossConfig.actions || {});
  const rows = [];
  for (let i = 0; i < entries.length; i += 4) {
    const row = new ActionRowBuilder();
    for (const [actionId, action] of entries.slice(i, i + 4)) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`boss_${actionId}_${messageId}`)
          .setLabel(action.label)
          .setStyle(styleFromName(action.style, ButtonStyle.Primary))
      );
    }
    rows.push(row);
  }
  return rows;
}

function renderBossContent(boss) {
  const phase = getBossPhase(boss.hp, boss.maxHp);
  const topDamage = Array.from(boss.damageDealt.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, damage], index) => `${index + 1}. <@${userId}>: ${damage}`)
    .join("\n") || "Ninguem causou dano ainda.";

  return [
    `${boss.mention} 🚨 **${boss.name.toUpperCase()} APARECEU!** 🚨`,
    "",
    `HP: \`${boss.hp} / ${boss.maxHp}\``,
    `Fase: **${phase.label}** | Fraqueza: **${phase.weakness}** | Resistencia: **${phase.resistance}**`,
    `Premio: **${boss.prize} Nanacoins** | Tempo: **${Math.round(boss.expireMs / 60000)} min**`,
    "",
    "**Top dano:**",
    topDamage
  ].join("\n");
}

async function createBossImage(typeConfig) {
  try {
    await assertForgeReady();
    
    const promptConfig = typeConfig.prompt;
    const finalPrompt = Array.isArray(promptConfig) 
      ? promptConfig[Math.floor(Math.random() * promptConfig.length)] 
      : promptConfig;

    const payload = {
      prompt: finalPrompt,
      negative_prompt: config.FORGE_REALISTIC_NEGATIVE_PROMPT + ", people, text, watermark",
      steps: 20,
      cfg_scale: 7.5,
      width: 512,
      height: 512,
      override_settings: {
        sd_model_checkpoint: config.FORGE_REALISTIC_MODEL
      },
      sampler_name: config.FORGE_SAMPLER,
      batch_size: 1
    };

    const response = await fetch(`${config.FORGE_HOST}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return null;
    const data = await response.json();
    return new AttachmentBuilder(Buffer.from(data.images[0], "base64"), { name: `${typeConfig.id}_boss.png` });
  } catch (err) {
    console.error("Erro ao gerar imagem do boss:", err);
    return null;
  }
}

async function spawnBoss(channels, type = "world") {
  const typeConfig = getBossTypeConfig(type);
  const attachment = await createBossImage(typeConfig);
  
  const baseHp = typeConfig.hp || 10000;
  const randomHp = Math.floor(Math.random() * (baseHp + 1)) + baseHp;

  for (const channel of channels) {
    if (!channel) continue;
    try {
      const placeholder = {
        type,
        name: typeConfig.name,
        mention: type === "world" ? "@here" : "",
        hp: randomHp,
        maxHp: randomHp,
        prize: typeConfig.prize,
        expireMs: typeConfig.expireMs,
        damageDealt: new Map(),
        cooldowns: new Map(),
        charges: new Map(),
        messageId: null,
        timerId: null,
        renderQueued: false
      };

      const payload = {
        content: renderBossContent(placeholder),
        components: [],
        files: attachment ? [attachment] : []
      };
      const msg = await channel.send(payload);
      placeholder.messageId = msg.id;
      await msg.edit({ content: renderBossContent(placeholder), components: buildBossRows(msg.id) }).catch(() => null);

      placeholder.timerId = setTimeout(() => {
        if (activeBosses.has(msg.id)) {
          msg.edit({ content: `⏰ **${typeConfig.name} fugiu!** O tempo acabou e a raid falhou.`, components: [] }).catch(() => null);
          activeBosses.delete(msg.id);
        }
      }, typeConfig.expireMs);

      activeBosses.set(msg.id, placeholder);
    } catch (err) {
      console.log(`⚠️ Falha ao spawnar ${typeConfig.name} no canal ${channel.id}: ${err.message}`);
    }
  }
}

function queueBossRender(messageId, message) {
  const boss = activeBosses.get(messageId);
  if (!boss || boss.renderQueued) return;

  boss.renderQueued = true;
  setTimeout(() => {
    // Verificar novamente se o boss continua ativo após o delay
    const currentBoss = activeBosses.get(messageId);
    if (!currentBoss) return;
    
    currentBoss.renderQueued = false;
    message.edit({
      content: renderBossContent(currentBoss),
      components: buildBossRows(messageId)
    }).catch(() => null);
  }, 2500);
}

async function finishBoss(interaction, boss) {
  if (boss.timerId) clearTimeout(boss.timerId);
  activeBosses.delete(interaction.message.id);

  const prizes = computeBossPrizes(
    boss.damageDealt,
    boss.prize,
    boss.maxHp,
    bossConfig.topBonus || [],
    bossConfig.minimumDamageForPrize || 1
  );

  let text = `🏆 **${boss.name.toUpperCase()} DERROTADO!** 🏆\nO premio de **${boss.prize} Nanacoins** foi dividido:\n\n`;
  for (const prize of prizes) {
    addCoins(prize.userId, prize.prize);
    text += `#${prize.rank} <@${prize.userId}>: ${prize.damage} dano, ganhou **${prize.prize} 🪙**\n`;
  }

  if (prizes.length === 0) text += "Ninguem atingiu dano minimo para receber premio.";

  await interaction.update({ components: [] }).catch(() => null);
  await interaction.message.edit({ content: text, components: [] }).catch(() => null);
}

async function handleBossInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith("boss_")) return false;

  const [, actionId] = interaction.customId.split("_");
  const boss = activeBosses.get(interaction.message.id);
  if (!boss) {
    await interaction.reply({ content: "Este boss ja foi derrotado ou expirou!", flags: MessageFlags.Ephemeral });
    return true;
  }

  const userId = interaction.user.id;
  const now = Date.now();
  const action = getBossAction(actionId);
  const cooldownKey = `${userId}:${actionId}`;
  const nextAttack = boss.cooldowns.get(cooldownKey) || 0;
  if (now < nextAttack) {
    const wait = Math.ceil((nextAttack - now) / 1000);
    await interaction.reply({ content: `⏳ Aguarde **${wait}s** para usar esta acao de novo.`, flags: MessageFlags.Ephemeral });
    return true;
  }

  boss.cooldowns.set(cooldownKey, now + action.cooldownMs);
  const phase = getBossPhase(boss.hp, boss.maxHp);
  const equippedWeapon = getEquippedWeapon(userId);
  const weaponResult = computeBossWeaponDamage(equippedWeapon, phase, action);
  const charge = boss.charges.get(userId) || 1;
  const attack = computeBossAttackDamage({
    actionId,
    hp: boss.hp,
    maxHp: boss.maxHp,
    charge,
    weaponDamage: weaponResult.damage
  });

  boss.charges.set(userId, actionId === "charge" ? (action.chargeBonus || 1) : 1);
  boss.hp = applyDamage(boss.hp, attack.damage);
  boss.damageDealt.set(userId, (boss.damageDealt.get(userId) || 0) + attack.damage);

  if (equippedWeapon && weaponResult.durabilityCost) {
    consumeWeaponDurability(userId, equippedWeapon.instanceId, weaponResult.durabilityCost);
  }

  const weaponText = equippedWeapon ? ` com **${formatWeaponLabel(equippedWeapon)}**` : "";
  const abilityText = weaponResult.ability ? `\n✨ Habilidade ativada: **${weaponResult.ability.label}**.` : "";

  if (boss.hp <= 0) {
    await interaction.reply({ content: `💥 Voce causou **${attack.damage}** de dano${weaponText}!${abilityText}`, flags: MessageFlags.Ephemeral }).catch(() => null);
    await finishBoss(interaction, boss);
    return true;
  }

  await interaction.reply({ content: `💥 Voce usou **${action.label}** e causou **${attack.damage}** de dano${weaponText}!${abilityText}`, flags: MessageFlags.Ephemeral });
  queueBossRender(interaction.message.id, interaction.message);
  return true;
}

module.exports = {
  spawnBoss,
  spawnWorldBoss: (channels) => spawnBoss(channels, "world"),
  spawnMiniBoss: (channels) => spawnBoss(channels, "mini"),
  handleBossInteraction,
  activeBosses
};

const config = require("../core/config");

function isSuperAdmin(userId) {
  return config.SUPERADMIN_IDS.includes(String(userId));
}

function getUserId(ctx) {
  return ctx?.author?.id || ctx?.user?.id || "";
}

async function requireSuperAdmin(ctx) {
  if (isSuperAdmin(getUserId(ctx))) return true;

  const payload = "❌ Apenas o Superadmin pode usar este comando!";
  if (typeof ctx.reply === "function") {
    await ctx.reply(payload).catch?.(() => null);
  }
  return false;
}

async function handleSpawnBossCommand(message) {
  if (!(await requireSuperAdmin(message))) return true;

  const { spawnWorldBoss } = require("../games/boss");
  const { EVENT_CHANNELS, resetBossTimer } = require("../games/forca");

  resetBossTimer();

  const bossChannels = [];
  for (const channelId of EVENT_CHANNELS) {
    const bossChannel = message.client.channels.cache.get(channelId)
      || await message.client.channels.fetch(channelId).catch(() => null);
    if (bossChannel) bossChannels.push(bossChannel);
  }

  if (bossChannels.length > 0) {
    await spawnWorldBoss(bossChannels);
    await message.reply("✅ World Boss sumonado com sucesso em todos os canais de evento! O contador de 12h foi resetado.");
  } else {
    await message.reply("❌ Não foi possível encontrar os canais de evento.");
  }
  return true;
}

async function handleSpawnMiniBossCommand(message) {
  if (!(await requireSuperAdmin(message))) return true;

  const { spawnMiniBoss } = require("../games/boss");
  const { EVENT_CHANNELS } = require("../games/forca");

  const bossChannels = [];
  for (const channelId of EVENT_CHANNELS) {
    const bossChannel = message.client.channels.cache.get(channelId)
      || await message.client.channels.fetch(channelId).catch(() => null);
    if (bossChannel) bossChannels.push(bossChannel);
  }

  if (bossChannels.length > 0) {
    await spawnMiniBoss(bossChannels);
    await message.reply("✅ Mini Boss sumonado com sucesso nos canais de evento!");
  } else {
    await message.reply("❌ Não foi possível encontrar os canais de evento.");
  }
  return true;
}

async function handleAdminCommand(message) {
  if (message.content.trim().toLowerCase().startsWith("!spawn_boss")) {
    return handleSpawnBossCommand(message);
  }
  if (message.content.trim().toLowerCase().startsWith("!spawn_miniboss") || message.content.trim().toLowerCase().startsWith("!spawn_mini")) {
    return handleSpawnMiniBossCommand(message);
  }
  return false;
}

module.exports = {
  isSuperAdmin,
  requireSuperAdmin,
  handleAdminCommand
};

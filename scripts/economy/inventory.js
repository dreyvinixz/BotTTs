const fs = require("fs");
const config = require("../core/config");
const { addCoins } = require("./economy");
const { createDebouncedJsonWriter } = require("../core/storage");

// Estrutura do inventário: { [userId]: { [itemId]: quantidade, lastDaily: timestamp, lastSmokeBomb: timestamp } }
let db = {};
const INVENTORY_PATH = config.paths.inventory;

function carregarInventario() {
  try {
    if (fs.existsSync(INVENTORY_PATH)) {
      const data = fs.readFileSync(INVENTORY_PATH, "utf-8");
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro ao carregar inventário:", err);
  }
}

const salvarInventario = createDebouncedJsonWriter(INVENTORY_PATH, () => db, config.static.app.timers.saveDebounceMs);

function ensureUser(userId) {
  if (!db[userId]) {
    db[userId] = {
      items: {},
      lastDaily: 0,
      lastSmokeBomb: 0
    };
  }
  if (!db[userId].items) db[userId].items = {};
}

function addItem(userId, itemId, amount = 1) {
  ensureUser(userId);
  if (!db[userId].items[itemId]) {
    db[userId].items[itemId] = 0;
  }
  db[userId].items[itemId] += amount;
  salvarInventario();
}

function removeItem(userId, itemId, amount = 1) {
  ensureUser(userId);
  if (db[userId].items[itemId]) {
    db[userId].items[itemId] -= amount;
    if (db[userId].items[itemId] <= 0) {
      delete db[userId].items[itemId];
    }
    salvarInventario();
    return true;
  }
  return false;
}

function hasItem(userId, itemId) {
  ensureUser(userId);
  return db[userId].items[itemId] > 0;
}

function canClaimSmokeBomb(userId) {
  ensureUser(userId);
  const now = Date.now();
  if (now - db[userId].lastSmokeBomb >= config.static.app.daily.smokeCooldownMs) {
    return true;
  }
  return false;
}

function updateSmokeBombTimer(userId) {
  ensureUser(userId);
  db[userId].lastSmokeBomb = Date.now();
  salvarInventario();
}

// Roleta Diária
async function handleDailyCommand(message) {
  const userId = message.author.id;
  ensureUser(userId);
  const now = Date.now();

  // Ignora o cooldown se for no canal de testes
  const isTestChannel = message.channel.id === config.static.app.test.channelId;

  if (!isTestChannel && now - db[userId].lastDaily < config.static.app.daily.cooldownMs) {
    const restante = config.static.app.daily.cooldownMs - (now - db[userId].lastDaily);
    const horas = Math.floor(restante / (1000 * 60 * 60));
    const minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
    return message.reply(`⏰ Você já girou a roleta diária! Volte em **${horas}h e ${minutos}m**.`);
  }

  db[userId].lastDaily = now;
  salvarInventario();

  const rng = Math.random();
  let rewardText = "";

  if (rng < 0.40) {
    // 40% chance de moedas (100 a 500)
    const coins = Math.floor(Math.random() * 401) + 100;
    addCoins(userId, coins);
    rewardText = `**${coins} Nanacoins 🪙**!`;
  } else if (rng < 0.60) {
    // 20% chance de Bomba de Fumaça
    addItem(userId, 'bomba_fumaca', 1);
    rewardText = `uma **Bomba de Fumaça 💨**! (Fica no inventário para escapar da cadeia na 3ª falha do roubo)`;
  } else if (rng < 0.80) {
    // 20% chance de Pé de Coelho
    addItem(userId, 'pe_coelho', 1);
    rewardText = `um **Pé de Coelho 🐰**! (Use-o no seu próximo !beijarmuro para garantir prêmios e evitar castigos)`;
  } else if (rng < 0.90) {
    // 10% chance de Jackpot
    const { getGameMultiplier } = require("./boosts");
    const coins = 1000 * getGameMultiplier(userId);
    addCoins(userId, coins);
    rewardText = `o prêmio **JACKPOT** de **${coins} Nanacoins 🪙**!`;
  } else {
    // 10% chance de Nada
    rewardText = `**NADA**! 🎲 A roleta parou na casa do azar. Mais sorte amanhã!`;
  }

  const roletaMsg = await message.reply(`📅 **ROLETA DIÁRIA** 🎰\nGirando a roleta... \`[ 🎲 | 🎲 | 🎲 ]\``);

  const frames = [
    "`[ 🪙 | 💨 | 🐰 ]`",
    "`[ 💥 | 🎲 | 💎 ]`",
    "`[ 🐰 | 🪙 | 💨 ]`",
    "`[ 🎲 | 💎 | 💥 ]`"
  ];
  
  for (let i = 0; i < frames.length; i++) {
    await new Promise(r => setTimeout(r, config.static.app.daily.animationDelayMs));
    await roletaMsg.edit(`📅 **ROLETA DIÁRIA** 🎰\nGirando a roleta... ${frames[i]}`).catch(() => null);
  }

  await new Promise(r => setTimeout(r, config.static.app.daily.animationDelayMs));

  return roletaMsg.edit(`📅 **ROLETA DIÁRIA** 🎰\nA roleta parou!\n\n🎉 Você ganhou: ${rewardText}`).catch(() => null);
}

carregarInventario();

module.exports = {
  addItem,
  removeItem,
  hasItem,
  canClaimSmokeBomb,
  updateSmokeBombTimer,
  handleDailyCommand
};

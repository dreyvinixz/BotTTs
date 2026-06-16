const fs = require("fs");
const fsPromises = require("fs").promises;
const config = require("./config");

let db = {};

function carregarEconomia() {
  try {
    if (fs.existsSync(config.ECONOMIA_PATH)) {
      const data = fs.readFileSync(config.ECONOMIA_PATH, "utf-8");
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro ao carregar economia:", err);
  }
}

let saveTimeout = null;
let isSaving = false;

function salvarEconomia() {
  if (saveTimeout) return; // Já tem um salvamento agendado

  // Agenda o salvamento para daqui a 2 segundos
  saveTimeout = setTimeout(async () => {
    if (isSaving) return; // Segurança contra chamadas concorrentes
    isSaving = true;
    try {
      const dataStr = JSON.stringify(db, null, 2);
      await fsPromises.writeFile(config.ECONOMIA_PATH, dataStr, "utf-8");
    } catch (err) {
      console.error("Erro ao salvar economia:", err);
    } finally {
      isSaving = false;
      saveTimeout = null; // Permite novo agendamento
    }
  }, 2000);
}

function getCoins(userId) {
  if (!db[userId]) {
    return 0;
  }
  return db[userId];
}

function addCoins(userId, amount) {
  if (!db[userId]) {
    db[userId] = 0;
  }
  db[userId] += amount;
  salvarEconomia();
  return db[userId];
}

function removeCoins(userId, amount) {
  if (!db[userId]) {
    db[userId] = 0;
  }
  
  if (db[userId] < amount) {
    console.warn(`⚠️ [ECONOMY] O sistema tentou remover ${amount} de ${userId}, mas ele só tinha ${db[userId]}! O saldo foi zerado. (Verifique lógica de compra sem fundos)`);
  }
  
  db[userId] -= amount;
  if (db[userId] < 0) {
    db[userId] = 0; // Evita saldo negativo
  }
  salvarEconomia();
  return db[userId];
}

// Carrega o banco de dados assim que o arquivo é inicializado
carregarEconomia();

function getTopPlayers(limit = 10) {
  return Object.entries(db)
    .sort((a, b) => b[1] - a[1]) // sort descending by balance
    .slice(0, limit)
    .map(([id, balance]) => ({ id, balance }));
}

async function handleDoarCommand(message, text) {
  const userId = message.author.id;
  const args = text.split(/\s+/);
  const mentions = message.mentions.users;
  const targetUser = mentions.first();

  if (!targetUser || args.length < 2) {
    return message.reply("Uso correto: `!doar @Pessoa <valor>` ou `!trade @Pessoa <valor>`");
  }

  if (targetUser.id === userId) {
    return message.reply("Você não pode doar para si mesmo!");
  }

  if (targetUser.bot) {
    return message.reply("Bots não precisam de dinheiro!");
  }

  let amountText = args[1];
  if (amountText.startsWith('<@')) amountText = args[0];
  
  const amount = parseInt(amountText, 10);
  if (isNaN(amount) || amount <= 0) {
    return message.reply("Você deve doar um valor válido maior que 0.");
  }

  const myCoins = getCoins(userId);
  if (myCoins < amount) {
    return message.reply(`Você não tem ${amount} Nanacoins 🪙 para doar! (Seu saldo: ${myCoins})`);
  }

  removeCoins(userId, amount);
  addCoins(targetUser.id, amount);

  return message.reply(`💸 **TRANSFERÊNCIA BANCÁRIA** 💸\n${message.author.username} foi muito gentil e doou **${amount} Nanacoins 🪙** para ${targetUser.username}!`);
}

function formatCoins(amount) {
  if (amount >= 1000) {
    return (amount / 1000) + 'k';
  }
  return amount.toString();
}

module.exports = {
  getCoins,
  addCoins,
  removeCoins,
  getTopPlayers,
  handleDoarCommand,
  formatCoins
};

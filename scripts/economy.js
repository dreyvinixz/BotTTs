const fs = require("fs");
const fsPromises = require("fs").promises;
const config = require("./config");
const { EmbedBuilder } = require("discord.js");

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
    .filter(([id]) => id !== 'teste_user_id') // Remove o usuário de teste do ranking
    .sort((a, b) => b[1] - a[1]) // sort descending by balance
    .slice(0, limit)
    .map(([id, balance]) => ({ id, balance }));
}

async function handleDoarCommand(message, text) {
  const userId = message.author.id;
  const args = text.split(/\s+/);
  const mentions = message.mentions.users;
  let targetUser = mentions.first();

  let amountText = args[1];
  let targetQuery = args[0];

  if (!targetUser && args.length >= 2) {
    targetQuery = args[0].trim().toLowerCase();
    amountText = args[1];

    targetUser = message.client.users.cache.find(u => 
      u.id === targetQuery || 
      u.username.toLowerCase() === targetQuery || 
      (u.globalName && u.globalName.toLowerCase() === targetQuery)
    );

    if (message.channel.id === '1348716118981742592' && targetQuery === 'teste') {
      targetUser = { id: 'teste_user_id', username: 'Zezinho do Teste', bot: false };
    } else {
      if (!targetUser) {
        for (const guild of message.client.guilds.cache.values()) {
          try {
            const members = await guild.members.fetch({ query: targetQuery, limit: 1 });
            if (members.size > 0) {
              targetUser = members.first().user;
              break;
            }
          } catch (err) {}
        }
      }
    }
  }

  if (!targetUser || !amountText) {
    return message.reply("Uso correto: `!doar @Pessoa <valor>` ou `!trade nome.usuario <valor>`");
  }

  if (targetUser.id === userId) {
    return message.reply("Você não pode doar para si mesmo!");
  }

  if (targetUser.bot) {
    return message.reply("Bots não precisam de dinheiro!");
  }

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

  const receiptEmbed = new EmbedBuilder()
    .setColor('#00FF00') // Verde claro
    .setTitle('💸 COMPROVANTE DE TRANSFERÊNCIA 💸')
    .setDescription('A transação via Pix/Wire foi concluída com sucesso.')
    .addFields(
      { name: 'Remetente', value: `**${message.author.username}**`, inline: true },
      { name: 'Destinatário', value: `**${targetUser.username}**`, inline: true },
      { name: 'Valor Transferido', value: `\`🪙 ${formatCoins(amount)} Nanacoins\``, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'Banco Central Nanacoin - Transação Autorizada' });

  return message.reply({ embeds: [receiptEmbed] });
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

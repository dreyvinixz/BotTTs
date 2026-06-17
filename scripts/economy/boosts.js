const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, StringSelectMenuBuilder } = require("discord.js");
const config = require("../core/config");
const { getCoins, addCoins, removeCoins, formatCoins } = require("./economy");

// Estruturas de memória para guardar os boosts ativos
// Map<userId, { mult: number, expire: timestamp }>
const gameBoosts = new Map();

// Map<userId, { chanceExtra: number, expire: timestamp }>
const stealBoosts = new Map();

// Map<userId, expire_timestamp>
const peCabraBoosts = new Map();
const escudoBoosts = new Map();

const BOOST_PRICES = config.static.shop.boosts || {};
const BOOST_MENU_ORDER = config.static.shop.menuOrder || Object.keys(BOOST_PRICES);

// Funções para uso em outros módulos
function getGameMultiplier(userId) {
  if (!gameBoosts.has(userId)) return 1;
  const boost = gameBoosts.get(userId);
  if (Date.now() > boost.expire) {
    gameBoosts.delete(userId);
    return 1;
  }
  return boost.mult;
}

function getStealChanceExtra(userId) {
  if (!stealBoosts.has(userId)) return 0;
  const boost = stealBoosts.get(userId);
  if (Date.now() > boost.expire) {
    stealBoosts.delete(userId);
    return 0;
  }
  return boost.chanceExtra;
}

function hasPeCabra(userId) {
  if (!peCabraBoosts.has(userId)) return false;
  if (Date.now() > peCabraBoosts.get(userId)) {
    peCabraBoosts.delete(userId);
    return false;
  }
  return true;
}

function hasEscudoEspinhos(userId) {
  if (!escudoBoosts.has(userId)) return false;
  if (Date.now() > escudoBoosts.get(userId)) {
    escudoBoosts.delete(userId);
    return false;
  }
  return true;
}

// Limpeza de Memória Periódica (a cada 1 hora)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [userId, boost] of gameBoosts.entries()) {
    if (now > boost.expire) gameBoosts.delete(userId);
  }
  for (const [userId, boost] of stealBoosts.entries()) {
    if (now > boost.expire) stealBoosts.delete(userId);
  }
  for (const [userId, expire] of peCabraBoosts.entries()) {
    if (now > expire) peCabraBoosts.delete(userId);
  }
  for (const [userId, expire] of escudoBoosts.entries()) {
    if (now > expire) escudoBoosts.delete(userId);
  }
}, config.static.app.boosts.cleanupIntervalMs);
cleanupInterval.unref?.();

// Handler do comando !boost
async function handleBoostCommand(message) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`boost_select_${message.author.id}`)
      .setPlaceholder('Escolha um Boost para comprar...')
      .addOptions(BOOST_MENU_ORDER.map((key) => {
        const item = BOOST_PRICES[key];
        return {
          label: item.menuLabel || item.label,
          description: item.description,
          value: key,
          emoji: item.emoji
        };
      }))
  );

  await message.reply({
    content: "🚀 **LOJA DE BOOSTS CLANDESTINA** 🚀\nAumente seus lucros nos minigames ou melhore suas chances de roubo!\n*(Este menu está trancado para você. Outros jogadores não podem usá-lo)*",
    components: [row]
  });
}

// Handler da interação do menu
async function handleBoostInteraction(interaction) {
  if (!interaction.isStringSelectMenu() || !interaction.customId.startsWith('boost_select_')) return;

  const ownerId = interaction.customId.split('_')[2];
  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: "❌ Esta loja foi aberta por outro jogador! Digite `!loja` no chat para abrir a sua própria loja.", flags: MessageFlags.Ephemeral });
  }

  const userId = interaction.user.id;
  const choice = interaction.values[0];
  const boostConfig = BOOST_PRICES[choice];

  if (!boostConfig) {
    return interaction.reply({ content: "Opção inválida.", flags: MessageFlags.Ephemeral });
  }

  // Casos especiais
  if (choice === 'bomba_fumaca_free') {
    const { addItem, canClaimSmokeBomb, updateSmokeBombTimer } = require("./inventory");
    if (!canClaimSmokeBomb(userId)) {
      return interaction.reply({ content: `❌ Você já resgatou sua Bomba de Fumaça recentemente! Volte depois de 12 horas.`, flags: MessageFlags.Ephemeral });
    }
    addItem(userId, boostConfig.grants || 'bomba_fumaca', 1);
    updateSmokeBombTimer(userId);
    return interaction.reply({ content: `✅ **SUCESSO!** Você resgatou uma **Bomba de Fumaça 💨** gratuita! Use-a com sabedoria.`, flags: MessageFlags.Ephemeral });
  }

  const myCoins = getCoins(userId);
  if (myCoins < boostConfig.cost) {
    return interaction.reply({ 
      content: `❌ Fundos insuficientes! Você precisa de **${formatCoins(boostConfig.cost)} Nanacoins 🪙** para comprar "${boostConfig.label}". (Seu saldo: ${formatCoins(myCoins)})`, 
      flags: MessageFlags.Ephemeral 
    });
  }

  // Desconta as moedas
  removeCoins(userId, boostConfig.cost);

  // Aplica o boost na memória ou adiciona item
  if (boostConfig.type === 'game') {
    gameBoosts.set(userId, {
      mult: boostConfig.mult,
      expire: Date.now() + boostConfig.durationMs
    });
  } else if (boostConfig.type === 'steal') {
    stealBoosts.set(userId, {
      chanceExtra: boostConfig.chanceExtra,
      expire: Date.now() + boostConfig.durationMs
    });
  } else if (boostConfig.type === 'buff' && boostConfig.buff === 'peCabra') {
    peCabraBoosts.set(userId, Date.now() + boostConfig.durationMs);
  } else if (boostConfig.type === 'buff' && boostConfig.buff === 'escudoEspinhos') {
    escudoBoosts.set(userId, Date.now() + boostConfig.durationMs);
  } else if (boostConfig.type === 'item') {
    const { addItem } = require("./inventory");
    addItem(userId, choice, 1);
  } else if (boostConfig.type === 'spawnBoss') {
    // Spawna o boss apenas neste canal
    const { spawnWorldBoss } = require("../games/boss");
    const { resetBossTimer } = require("../games/forca");
    
    // Força o reset das 12h no games.js
    if (resetBossTimer) resetBossTimer();

    spawnWorldBoss([interaction.channel]);
  }

  // Responde efemeramente
  await interaction.reply({ 
    content: `✅ **SUCESSO!** Você comprou o **${boostConfig.label}** por ${formatCoins(boostConfig.cost)} Nanacoins. O efeito já está ativo!`, 
    flags: MessageFlags.Ephemeral 
  });

  // Avisa publicamente no canal
  const channel = interaction.client.channels.cache.get(interaction.channelId);
  if (channel) {
    channel.send(`🚀 **ALERTA DE BOOST!** O(A) jogador(a) **${interaction.user.username}** acaba de ativar um **${boostConfig.label}**! O mercado de Nanacoins está aquecido!`);
  }
}
// Função helper para dar boost diretamente (usado no Fliperama)
function giveBoost(userId, choice) {
  const boostConfig = BOOST_PRICES[choice];
  if (!boostConfig) return;

  if (boostConfig.type === 'game') {
    gameBoosts.set(userId, {
      mult: boostConfig.mult,
      expire: Date.now() + boostConfig.durationMs
    });
  } else if (boostConfig.type === 'steal') {
    stealBoosts.set(userId, {
      chanceExtra: boostConfig.chanceExtra,
      expire: Date.now() + boostConfig.durationMs
    });
  } else if (boostConfig.type === 'buff' && boostConfig.buff === 'peCabra') {
    peCabraBoosts.set(userId, Date.now() + boostConfig.durationMs);
  } else if (boostConfig.type === 'buff' && boostConfig.buff === 'escudoEspinhos') {
    escudoBoosts.set(userId, Date.now() + boostConfig.durationMs);
  } else if (boostConfig.type === 'item' || boostConfig.type === 'spawnBoss') {
    const { addItem } = require("./inventory");
    addItem(userId, choice, 1);
  }
}


module.exports = {
  handleBoostCommand,
  handleBoostInteraction,
  getGameMultiplier,
  getStealChanceExtra,
  hasPeCabra,
  hasEscudoEspinhos,
  giveBoost
};

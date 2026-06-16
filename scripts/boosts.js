const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, StringSelectMenuBuilder } = require("discord.js");
const { getCoins, addCoins, removeCoins, formatCoins } = require("./economy");

// Estruturas de memória para guardar os boosts ativos
// Map<userId, { mult: number, expire: timestamp }>
const gameBoosts = new Map();

// Map<userId, { chanceExtra: number, expire: timestamp }>
const stealBoosts = new Map();

// Tabela de preços e configurações
const BOOST_PRICES = {
  // Boosts para Games (Forca e Show do Milhão)
  game_2x: { mult: 2, hours: 2, cost: 1000, label: "Boost Games 2x (2 horas)" },
  game_3x: { mult: 3, hours: 1, cost: 5000, label: "Boost Games 3x (1 hora)" },
  game_4x: { mult: 4, hours: 0.5, cost: 10000, label: "Boost Games 4x (30 minutos)" },
  
  // Boosts para Roubo (Aumento na chance base que é 50%)
  steal_10: { chanceExtra: 0.10, mins: 5, cost: 800, label: "Boost Roubo +10% (5 minutos)" }, // Total 60%
  steal_20: { chanceExtra: 0.20, mins: 3, cost: 1600, label: "Boost Roubo +20% (3 minutos)" } // Total 70%
};

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

// Limpeza de Memória Periódica (a cada 1 hora)
setInterval(() => {
  const now = Date.now();
  for (const [userId, boost] of gameBoosts.entries()) {
    if (now > boost.expire) gameBoosts.delete(userId);
  }
  for (const [userId, boost] of stealBoosts.entries()) {
    if (now > boost.expire) stealBoosts.delete(userId);
  }
}, 60 * 60 * 1000);

// Handler do comando !boost
async function handleBoostCommand(message) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('boost_select')
      .setPlaceholder('Escolha um Boost para comprar...')
      .addOptions(
        {
          label: 'Game Boost 2x',
          description: 'Dobro de moedas em Forca/Show (2h) - 1k Nanacoins',
          value: 'game_2x',
          emoji: '🎮'
        },
        {
          label: 'Game Boost 3x',
          description: 'Triplo de moedas em Forca/Show (1h) - 5k Nanacoins',
          value: 'game_3x',
          emoji: '🔥'
        },
        {
          label: 'Game Boost 4x',
          description: 'Quádruplo de moedas em Forca/Show (30m) - 10k Nanacoins',
          value: 'game_4x',
          emoji: '💥'
        },
        {
          label: 'Roubo Boost +10%',
          description: '60% de chance de roubo (5 min) - 800 Nanacoins',
          value: 'steal_10',
          emoji: '🥷'
        },
        {
          label: 'Roubo Boost +20%',
          description: '70% de chance de roubo (3 min) - 1.6k Nanacoins',
          value: 'steal_20',
          emoji: '💎'
        }
      )
  );

  await message.reply({
    content: "🚀 **LOJA DE BOOSTS CLANDESTINA** 🚀\nAumente seus lucros nos minigames ou melhore suas chances de roubo!\n*(Somente você pode ver e interagir com este menu)*",
    components: [row],
    flags: MessageFlags.Ephemeral
  });
}

// Handler da interação do menu
async function handleBoostInteraction(interaction) {
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'boost_select') return;

  const userId = interaction.user.id;
  const choice = interaction.values[0];
  const boostConfig = BOOST_PRICES[choice];

  if (!boostConfig) {
    return interaction.reply({ content: "Opção inválida.", flags: MessageFlags.Ephemeral });
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

  // Aplica o boost na memória
  if (choice.startsWith('game_')) {
    gameBoosts.set(userId, {
      mult: boostConfig.mult,
      expire: Date.now() + boostConfig.hours * 60 * 60 * 1000
    });
  } else if (choice.startsWith('steal_')) {
    stealBoosts.set(userId, {
      chanceExtra: boostConfig.chanceExtra,
      expire: Date.now() + boostConfig.mins * 60 * 1000
    });
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

module.exports = {
  handleBoostCommand,
  handleBoostInteraction,
  getGameMultiplier,
  getStealChanceExtra
};

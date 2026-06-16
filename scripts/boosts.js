const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, StringSelectMenuBuilder } = require("discord.js");
const { getCoins, addCoins, removeCoins, formatCoins } = require("./economy");

// Estruturas de memória para guardar os boosts ativos
// Map<userId, { mult: number, expire: timestamp }>
const gameBoosts = new Map();

// Map<userId, { chanceExtra: number, expire: timestamp }>
const stealBoosts = new Map();

// Map<userId, expire_timestamp>
const peCabraBoosts = new Map();
const escudoBoosts = new Map();

// Tabela de preços e configurações
const BOOST_PRICES = {
  // Boosts para Games (Forca e Show do Milhão)
  game_2x: { mult: 2, hours: 2, cost: 1000, label: "Boost Games 2x (2 horas)" },
  game_3x: { mult: 3, hours: 1, cost: 5000, label: "Boost Games 3x (1 hora)" },
  game_4x: { mult: 4, hours: 0.5, cost: 10000, label: "Boost Games 4x (30 minutos)" },
  
  // Boosts para Roubo (Aumento na chance base que é 50%)
  steal_10: { chanceExtra: 0.10, mins: 5, cost: 800, label: "Boost Roubo +10% (5 minutos)" }, // Total 60%
  steal_20: { chanceExtra: 0.20, mins: 3, cost: 1600, label: "Boost Roubo +20% (3 minutos)" }, // Total 70%
  
  // Novos itens
  pe_cabra: { type: 'buff', mins: 5, cost: 1000, label: "Pé de Cabra (5 minutos)" },
  escudo_espinhos: { type: 'buff', mins: 120, cost: 1000, label: "Escudo de Espinhos (2 horas)" },
  pe_coelho: { type: 'item', cost: 250, label: "Pé de Coelho (1 uso)" },
  bomba_fumaca: { type: 'item', cost: 0, label: "Bomba de Fumaça (Grátis)" },
  acido_corrosivo: { type: 'item', cost: 2000, label: "Ácido Corrosivo (1 uso)" }
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
setInterval(() => {
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
}, 60 * 60 * 1000);

// Handler do comando !boost
async function handleBoostCommand(message) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`boost_select_${message.author.id}`)
      .setPlaceholder('Escolha um Boost para comprar...')
      .addOptions(
        {
          label: 'Bomba de Fumaça (Grátis)',
          description: 'Foge da cadeia no 3º roubo falho. Resgate a cada 12h',
          value: 'bomba_fumaca',
          emoji: '💨'
        },
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
        },
        {
          label: 'Pé de Coelho',
          description: 'Garante vitória e pula castigo no próximo Beijar o Muro - 250',
          value: 'pe_coelho',
          emoji: '🐰'
        },
        {
          label: 'Pé de Cabra',
          description: 'Roubos de sucesso tiram 40% a 80% da grana (5 min) - 1k',
          value: 'pe_cabra',
          emoji: '🔧'
        },
        {
          label: 'Escudo de Espinhos',
          description: 'Se ladrão falhar, ele te paga 10% do dinheiro dele (2h) - 1k',
          value: 'escudo_espinhos',
          emoji: '🛡️'
        },
        {
          label: 'Ácido Corrosivo',
          description: '45% de chance de furar o Parrudo da vítima no roubo (1 uso) - 2k',
          value: 'acido_corrosivo',
          emoji: '🧪'
        }
      )
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
  if (choice === 'bomba_fumaca') {
    const { addItem, canClaimSmokeBomb, updateSmokeBombTimer } = require("./inventory");
    if (!canClaimSmokeBomb(userId)) {
      return interaction.reply({ content: `❌ Você já resgatou sua Bomba de Fumaça recentemente! Volte depois de 12 horas.`, flags: MessageFlags.Ephemeral });
    }
    addItem(userId, 'bomba_fumaca', 1);
    updateSmokeBombTimer(userId);
    return interaction.reply({ content: `✅ **SUCESSO!** Você resgatou uma **Bomba de Fumaça 💨**! Use-a com sabedoria.`, flags: MessageFlags.Ephemeral });
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
  } else if (choice === 'pe_cabra') {
    peCabraBoosts.set(userId, Date.now() + boostConfig.mins * 60 * 1000);
  } else if (choice === 'escudo_espinhos') {
    escudoBoosts.set(userId, Date.now() + boostConfig.mins * 60 * 1000);
  } else if (choice === 'pe_coelho') {
    const { addItem } = require("./inventory");
    addItem(userId, 'pe_coelho', 1);
  } else if (choice === 'acido_corrosivo') {
    const { addItem } = require("./inventory");
    addItem(userId, 'acido_corrosivo', 1);
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
  getStealChanceExtra,
  hasPeCabra,
  hasEscudoEspinhos
};

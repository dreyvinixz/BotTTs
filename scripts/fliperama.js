const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { getCoins, addCoins, removeCoins, formatCoins } = require("./economy");
const { giveBoost } = require("./boosts");

const LOOTBOXES = {
  bronze: {
    cost: 500,
    label: "📦 Caixa de Bronze",
    desc: "Prêmios comuns (Boost Roubo, Pé de Coelho, moedas 100~800)",
    color: '#CD7F32'
  },
  prata: {
    cost: 2500,
    label: "🎁 Caixa de Prata",
    desc: "Prêmios incomuns (Game Boosts, Ácido Corrosivo, moedas 1000~4000)",
    color: '#C0C0C0'
  },
  ouro: {
    cost: 10000,
    label: "💎 Caixa de Ouro",
    desc: "Prêmios RAROS (Game Boost 4x, Invocação Boss, até 30k NC, Risco de perder 5k)",
    color: '#FFD700'
  }
};

async function handleFliperamaCommand(message) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`fliperama_buy_bronze_${message.author.id}`).setLabel("Abrir Bronze (500)").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`fliperama_buy_prata_${message.author.id}`).setLabel("Abrir Prata (2.5k)").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`fliperama_buy_ouro_${message.author.id}`).setLabel("Abrir Ouro (10k)").setStyle(ButtonStyle.Success)
  );

  const embed = new EmbedBuilder()
    .setColor('#FF00FF')
    .setTitle('🎰 FLIPERAMA CLANDESTINO 🎰')
    .setDescription('Bem-vindo ao Fliperama! Gaste suas Nanacoins para abrir as LootBoxes!\n\n' + 
      `**${LOOTBOXES.bronze.label}** - ${LOOTBOXES.bronze.cost} NC\n> ${LOOTBOXES.bronze.desc}\n\n` +
      `**${LOOTBOXES.prata.label}** - ${LOOTBOXES.prata.cost} NC\n> ${LOOTBOXES.prata.desc}\n\n` +
      `**${LOOTBOXES.ouro.label}** - ${LOOTBOXES.ouro.cost} NC\n> ${LOOTBOXES.ouro.desc}`
    )
    .setFooter({ text: 'Apenas você pode clicar nestes botões.' });

  await message.reply({ embeds: [embed], components: [row] });
}

async function handleFliperamaInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('fliperama_buy_')) return false;

  const parts = interaction.customId.split('_');
  const type = parts[2]; // bronze, prata, ouro
  const ownerId = parts[3];

  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: "❌ Esta máquina não é sua! Digite `!fliperama` no chat para jogar.", flags: MessageFlags.Ephemeral });
    return true;
  }

  const box = LOOTBOXES[type];
  if (!box) return true;

  const userId = interaction.user.id;
  const balance = getCoins(userId);

  if (balance < box.cost) {
    await interaction.reply({ content: `❌ Você precisa de **${formatCoins(box.cost)} NC** para abrir a ${box.label}. (Seu saldo: ${formatCoins(balance)})`, flags: MessageFlags.Ephemeral });
    return true;
  }

  // Desconta o valor da caixa
  removeCoins(userId, box.cost);

  // Gira o prêmio
  const rng = Math.random();
  let prizeText = "";
  let embedColor = box.color;

  if (type === 'bronze') {
    if (rng < 0.20) {
      giveBoost(userId, 'pe_coelho');
      prizeText = "um **Pé de Coelho 🐰**!";
    } else if (rng < 0.40) {
      giveBoost(userId, 'steal_10');
      prizeText = "um **Boost Roubo +10% 🥷** (10 minutos)!";
    } else if (rng < 0.65) {
      const win = Math.floor(Math.random() * 701) + 100; // 100 a 800
      addCoins(userId, win);
      prizeText = `**${win} Nanacoins 🪙**!`;
    } else {
      prizeText = "absolutamente **NADA**! 🎲 A caixa estava vazia.";
    }
  } else if (type === 'prata') {
    if (rng < 0.15) {
      giveBoost(userId, 'acido_corrosivo');
      prizeText = "um **Ácido Corrosivo 🧪**!";
    } else if (rng < 0.35) {
      giveBoost(userId, 'game_2x');
      prizeText = "um **Game Boost 2x 🎮** (1 hora)!";
    } else if (rng < 0.50) {
      giveBoost(userId, 'escudo_espinhos');
      prizeText = "um **Escudo de Espinhos 🛡️** (2 horas)!";
    } else if (rng < 0.85) {
      const win = Math.floor(Math.random() * 3001) + 1000; // 1000 a 4000
      addCoins(userId, win);
      prizeText = `**${win} Nanacoins 🪙**!`;
    } else {
      prizeText = "**NADA**! 🎲 Você abriu a caixa e não encontrou nada.";
    }
  } else if (type === 'ouro') {
    if (rng < 0.15) {
      // 15% chance perder 5.000 NC (Além dos 10k do custo)
      const currentBalance = getCoins(userId);
      const penalty = Math.min(currentBalance, 5000);
      if (penalty > 0) removeCoins(userId, penalty);
      prizeText = `**AZAR SUPREMO!** 📉 A caixa estava amaldiçoada! Você perdeu **${formatCoins(penalty)} Nanacoins** extras do seu saldo.`;
      embedColor = '#FF0000';
    } else if (rng < 0.30) {
      // 15% de invocar o Boss
      const { spawnWorldBoss } = require("./boss");
      const { EVENT_CHANNELS, resetBossTimer } = require("./games");
      if (resetBossTimer) resetBossTimer();
      const bossChannels = [];
      for (const channelId of EVENT_CHANNELS) {
        const bossChannel = interaction.client.channels.cache.get(channelId);
        if (bossChannel) bossChannels.push(bossChannel);
      }
      if (bossChannels.length > 0) spawnWorldBoss(bossChannels);
      prizeText = "a **Invocação do World Boss 👹**! O chefão acaba de aparecer nos canais de evento!";
    } else if (rng < 0.45) {
      // 15% de Game Boost 4x
      giveBoost(userId, 'game_4x');
      prizeText = "um **Game Boost 4x 🚀** (30 minutos)!";
    } else if (rng < 0.85) {
      // 40% de ganhar grana massiva
      const win = Math.floor(Math.random() * 15001) + 15000; // 15000 a 30000
      addCoins(userId, win);
      prizeText = `o prêmio gordo de **${formatCoins(win)} Nanacoins 🪙**!`;
    } else {
      // 15% de não ganhar nada
      prizeText = "**NADA**! 🎲 Um goblin roubou seu prêmio de dentro da caixa.";
    }
  }

  const resultEmbed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`Você abriu a ${box.label}`)
    .setDescription(`O botão foi apertado... a caixa estremece e se abre revelando:\n\n🎉 **${prizeText}**`)
    .setFooter({ text: `Custou ${formatCoins(box.cost)} NC.` });

  await interaction.reply({ embeds: [resultEmbed] });
  return true;
}

module.exports = {
  handleFliperamaCommand,
  handleFliperamaInteraction
};

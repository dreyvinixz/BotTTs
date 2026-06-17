const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, StringSelectMenuBuilder } = require("discord.js");
const config = require("../core/config");
const { getCoins, addCoins, removeCoins, formatCoins } = require("./economy");
const { listWeaponDefs, grantWeapon, formatWeaponLabel } = require("./weapons");

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

function shopButtons(ownerId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`shop_cat_boosts_${ownerId}`).setLabel("Boosts").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`shop_cat_items_${ownerId}`).setLabel("Itens").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`shop_cat_weapons_${ownerId}`).setLabel("Armas").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`shop_cat_legendary_${ownerId}`).setLabel("Lendarias").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`shop_cat_market_${ownerId}`).setLabel("Bolsa de Valores").setStyle(ButtonStyle.Secondary)
    )
  ];
}

function boostOptions(category) {
  return BOOST_MENU_ORDER
    .filter((key) => {
      const item = BOOST_PRICES[key];
      if (category === "items") return ["item", "freeItem", "spawnBoss", "spawnMiniBoss"].includes(item.type);
      if (category === "boosts") return !["item", "freeItem", "spawnBoss", "spawnMiniBoss"].includes(item.type);
      return true;
    })
    .map((key) => {
      const item = BOOST_PRICES[key];
      return {
        label: item.menuLabel || item.label,
        description: item.description,
        value: key,
        emoji: item.emoji
      };
    });
}

function buildBoostSelect(ownerId, category = "all") {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`boost_select_${ownerId}`)
      .setPlaceholder('Escolha uma compra...')
      .addOptions(boostOptions(category).slice(0, 25))
  );
  return row;
}

function buildWeaponSelect(ownerId, rarity = "all") {
  const weapons = listWeaponDefs({
    shopEnabled: true,
    rarity: rarity === "all" ? undefined : rarity
  }).slice(0, 25);

  const rarityEmojis = { comum: "⚪", raro: "🔵", epico: "🟣", lendario: "🟡" };

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`weapon_select_${ownerId}`)
      .setPlaceholder("Escolha uma arma para comprar...")
      .addOptions(weapons.map((weapon) => ({
        label: `${weapon.name} (${weapon.rarity})`.slice(0, 100),
        description: `${formatCoins(weapon.basePrice)} NC | ${weapon.durability} usos | Dano boss +${weapon.bossDamage}`.slice(0, 100),
        value: weapon.id,
        emoji: rarityEmojis[weapon.rarity] || "🔹"
      })))
  );
}

// Handler do comando !boost
async function handleBoostCommand(message) {
  const payload = {
    content: "🏪 **MERCADO NANACOIN**\nEscolha uma categoria. Armas compradas aqui entram no seu inventário e podem ser equipadas com `!equipar <id>`.",
    embeds: [],
    components: shopButtons(message.author?.id || message.user?.id)
  };
  
  if (message.update) return message.update(payload);
  return message.reply(payload);
}

async function showShopCategory(interaction, category) {
  const ownerId = interaction.customId.split("_").at(-1);
  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: "❌ Esta loja foi aberta por outro jogador! Digite `!loja` no chat para abrir a sua.", flags: MessageFlags.Ephemeral });
  }

  if (category === "market") {
    const { handleMarketCommand } = require("./market");
    return handleMarketCommand({ user: interaction.user, update: (payload) => interaction.update(payload) });
  }

  const { EmbedBuilder } = require("discord.js");
  
  if (category === "weapons" || category === "legendary") {
    const isLegendary = category === "legendary";
    const embed = new EmbedBuilder()
      .setColor(isLegendary ? "#EAB308" : "#EF4444")
      .setTitle(isLegendary ? "🟡 Forja de Armas Lendárias" : "⚔️ Arsenal de Armas")
      .setDescription(isLegendary 
        ? "Armas extremamente raras com habilidades passivas únicas! Escolha com sabedoria." 
        : "Melhore seu poder de combate nas Raids e Duelos equipando novas armas do arsenal.")
      .setFooter({ text: "Use o menu abaixo para visualizar os detalhes e comprar." });

    return interaction.update({
      content: "",
      embeds: [embed],
      components: [buildWeaponSelect(ownerId, isLegendary ? "lendario" : "all"), ...shopButtons(ownerId)]
    });
  }

  const isItems = category === "items";
  const embed = new EmbedBuilder()
    .setColor(isItems ? "#3B82F6" : "#8B5CF6")
    .setTitle(isItems ? "🎒 Suprimentos e Consumíveis" : "🚀 Mercado de Boosts")
    .setDescription(isItems
      ? "Itens de uso único que podem te salvar de prisões, castigos ou furar as defesas inimigas!"
      : "Multiplique seus ganhos, aumente suas chances de roubo e compre proteções temporárias.")
    .setFooter({ text: "Selecione um item no menu abaixo para comprar." });

  return interaction.update({
    content: "",
    embeds: [embed],
    components: [buildBoostSelect(ownerId, category), ...shopButtons(ownerId)]
  });
}

// Handler da interação do menu
async function handleBoostInteraction(interaction) {
  if (interaction.isButton() && interaction.customId.startsWith("shop_cat_")) {
    return showShopCategory(interaction, interaction.customId.split("_")[2]);
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("weapon_select_")) {
    const ownerId = interaction.customId.split("_")[2];
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Esta loja foi aberta por outro jogador! Digite `!loja` no chat para abrir a sua.", flags: MessageFlags.Ephemeral });
    }
    const weaponId = interaction.values[0];
    const weapon = listWeaponDefs().find((item) => item.id === weaponId);
    if (!weapon) return interaction.reply({ content: "Arma inválida.", flags: MessageFlags.Ephemeral });
    const balance = getCoins(interaction.user.id);
    if (balance < weapon.basePrice) {
      return interaction.reply({ content: `❌ Você precisa de **${formatCoins(weapon.basePrice)} NC** para comprar ${weapon.name}.`, flags: MessageFlags.Ephemeral });
    }
    removeCoins(interaction.user.id, weapon.basePrice);
    const instance = grantWeapon(interaction.user.id, weaponId);
    return interaction.reply({ content: `✅ Você comprou **${weapon.name}** por ${formatCoins(weapon.basePrice)} NC. ID: \`${instance.instanceId}\``, flags: MessageFlags.Ephemeral });
  }

  if (!interaction.isStringSelectMenu() || !interaction.customId.startsWith('boost_select_')) return false;

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
  } else if (boostConfig.type === 'spawnBoss' || boostConfig.type === 'spawnMiniBoss') {
    const { spawnWorldBoss, spawnMiniBoss } = require("../games/boss");
    const { resetBossTimer } = require("../games/forca");
    
    // Força o reset das 12h no games.js se for o World Boss principal
    if (boostConfig.type === 'spawnBoss' && resetBossTimer) resetBossTimer();

    // Spawna apenas no canal em que a compra foi efetuada
    if (boostConfig.type === 'spawnBoss') {
      spawnWorldBoss([interaction.channel]);
    } else {
      spawnMiniBoss([interaction.channel]);
    }
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
  } else if (boostConfig.type === 'item' || boostConfig.type === 'spawnBoss' || boostConfig.type === 'spawnMiniBoss') {
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

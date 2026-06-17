const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const config = require("./config");
const { isCommand, getCommandText } = require("./utils");
const { assertOllamaReady } = require("./services");
const { limparResposta, pedirRespostaAoOllama } = require("./ollama");
const { handleVoiceCommand } = require("./voice");
const { handleImageCommand } = require("./image");
const {
  isPerguntaMapasPathOfExile,
  respostaMapasPathOfExile,
  perguntarQuestion
} = require("./question");
const {
  coletarGifs,
  cachearMensagem,
  maybeExtrairFofocas,
  maybeResponderEspontaneo
} = require("./chat");
const { handleForcaCommand, handleForcaThemeInteraction, checkForcaGuess, checkAndSpawnEvent, handleEventInteraction, EVENT_CHANNELS, resetBossTimer } = require("./games");
const { getCoins, getTopPlayers, handleDoarCommand } = require("./economy");
const { handleRoubarCommand, handleDueloCommand, handleButtonInteraction, handleTimeoutCommand, handleFiancaCommand, handleParrudoCommand, isPrisioneiro, handleBeijarMuroCommand } = require("./duel");
const { handleAventuraCommand, handleRpgInteraction } = require("./rpg");
const { handleBoostCommand, handleBoostInteraction } = require("./boosts");
const { checkAndSendTip } = require("./tips");

function createClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });
}

function buildHelpEmbed() {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🤖 Comandos do Nana 🍌')
    .setDescription('Aqui está a lista de tudo que eu posso fazer por você no servidor!\nExplore os comandos por categoria abaixo.')
    .addFields(
      { name: '💰 Economia & Loja', value: [
        '`!daily` / `!diario` - 🎁 Gire a roleta diária para ganhar prêmios e itens!',
        '`!saldo` / `!nanacoins` - 💵 Verifica quanto dinheiro virtual você tem.',
        '`!rank` - 🏆 Mostra os mais ricos do servidor.',
        '`!doar <@user> <valor>` - 💸 Transfere Nanacoins para outro jogador.',
        '`!loja` - 🚀 Abre a loja clandestina (Boosts, Bombas, Pé de Coelho, etc).'
      ].join('\n') },
      { name: '⚔️ Crime & Duelo', value: [
        '`!roubar <@user>` - 🥷 Tenta furtar Nanacoins de alguém (50% de chance).',
        '`!parrudo <horas>h` - 🛡️ Compra imunidade a roubos por X horas.',
        '`!timeout` - 🚓 Verifica quanto tempo falta para sair da prisão.',
        '`!fianca [@user]` - 💸 Paga 250 Nanacoins para sair ou libertar amigo da prisão.',
        '`!duelo <@user> <valor>` - ⚔️ Batalha tática valendo moedas.',
        '`!beijarmuro` - 💋 Beija o muro e testa sua sorte (pode dar bom ou muito ruim).'
      ].join('\n') },
      { name: '🎮 Games & RPG', value: [
        '`!games` - 🎰 Abre o Fliperama do Nana! Jogue Forca, Aventura/Trivia ou Duelo com uma interface chamativa.'
      ].join('\n') },
      { name: '🧠 IA & Utilidades', value: [
        '`!nana <texto>` - 💬 Conversa com a IA no modo casual/persona.',
        '`!question <texto>` - 🧠 Pergunta séria, resposta profissional.',
        '`!img <prompt>` - 🖼️ Gera imagem realista pelo Forge.',
        '`!anime <prompt>` - 🌸 Gera imagem em estilo anime pelo Forge.',
        '`!f <texto>` - 🔊 Fala no canal de voz onde você está.',
        '`!clear [cmd] <num>` - 🧹 Apaga mensagens do bot ou comandos de usuários.'
      ].join('\n') }
    )
    .setFooter({ text: 'Dica: Eu também respondo se você me mencionar ou me chamar pelo nome no chat livre!' });
}

function buildNewEmbed() {
  return new EmbedBuilder()
    .setColor('#00FF00') // Verde neon chamativo
    .setTitle('🌟 NOVIDADES DO NANA V4.0 🌟')
    .setDescription('O bot acabou de receber uma **atualização massiva** com chefões, roleta diária e um inventário de itens sujos! Confira o que mudou:')
    .addFields(
      { name: '🐉 O Retorno do World Boss', value: 'A cada **12 horas**, um monstro épico gerado por IA invade o chat! Todos podem atacar juntos para dividir uma recompensa absurda de **10.000 Nanacoins**!' },
      { name: '📅 Roleta Diária (`!daily`)', value: 'Você ganhou o direito de girar a roleta 1 vez por dia! Pode ganhar moedas, o grande Jackpot ou itens especiais.' },
      { name: '🎒 Novos Itens da Loja (`!loja`)', value: [
        '💨 **Bomba de Fumaça (GRÁTIS):** Resgate de graça a cada 12h! Se a polícia tentar te prender na 2ª falha de roubo, você foge ileso.',
        '🐰 **Pé de Coelho:** Chega de azar! Garante vitória máxima e anula a polícia no seu próximo `!beijarmuro`.',
        '🔧 **Pé de Cabra:** Roubos bem-sucedidos vão arrancar de 40% a 80% do dinheiro da vítima por 5 minutos.',
        '🛡️ **Escudo de Espinhos:** Se alguém tentar te roubar e falhar, o ladrão espeta o dedo e te paga 10% do dinheiro dele como multa!'
      ].join('\n') },
      { name: '🎰 O NOVO FLIPERAMA (`!games`)', value: 'Esqueça os comandos velhos! Digite **`!games`** para abrir o novo cassino interativo. Agora a Forca suporta múltiplas rodadas automáticas e o Duelo é iniciado sem complicação!' },
      { name: '✨ Ajustes Rápidos', value: [
        '🎨 **Novo `!help`:** O painel de ajuda foi totalmente refeito e agora é um card organizado.',
        '💸 **Fiança Amiga (`!fianca @usuario`):** Agora você pode pagar a fiança de um amigo que rodou na polícia (250 coins).',
        '🛡️ **Parrudo Barato (`!parrudo`):** Nova opção rápida de `1h` de imunidade a roubos por apenas 250 moedas!'
      ].join('\n') }
    )
    .setImage('https://media.tenor.com/XqT7hS_m4_kAAAAC/hype-train.gif') // Gif chamativo de hype
    .setFooter({ text: 'A economia está pegando fogo! Divirta-se e cuidado com as costas!' });
}

async function sendChunkedReply(message, text) {
  if (!text) return message.reply("Não consegui montar uma resposta.");
  const limit = 1950;
  if (text.length <= limit) {
    return message.reply({ content: text, allowedMentions: { repliedUser: false, parse: [] } });
  }
  
  let remaining = text;
  let isFirst = true;
  while (remaining.length > 0) {
    let chunk = remaining.substring(0, limit);
    let lastNewline = chunk.lastIndexOf('\n');
    if (lastNewline > 0 && remaining.length > limit) {
      chunk = chunk.substring(0, lastNewline);
    }
    remaining = remaining.substring(chunk.length).trim();
    
    if (isFirst) {
      await message.reply({ content: chunk, allowedMentions: { repliedUser: false, parse: [] } });
      isFirst = false;
    } else {
      await message.channel.send({ content: chunk, allowedMentions: { repliedUser: false, parse: [] } });
    }
  }
}

async function handleTextCommand(message) {
  const texto = getCommandText(message, ["!nana"]);
  if (!texto) {
    return message.reply("Digite uma pergunta: `!nana me explica isso aqui`");
  }

  try {
    await assertOllamaReady();
    const resposta = limparResposta(await pedirRespostaAoOllama([
      { role: "system", content: "Responda em português do Brasil de forma direta, natural e curta." },
      { role: "user", content: texto }
    ]));

    return sendChunkedReply(message, resposta);
  } catch (err) {
    console.log("🔥 Erro no comando de texto:", err.message);
    return message.reply("⚠️ Erro só no texto/LLM. Abre o Ollama com `ollama serve`.");
  }
}

async function handleQuestionCommand(message) {
  const texto = getCommandText(message, ["!question"]);
  if (!texto) {
    return message.reply("Digite a pergunta: `!question quais são os mapas de Path of Exile?`");
  }

  if (config.QUESTION_PROVIDER !== "gemini_cli" && isPerguntaMapasPathOfExile(texto)) {
    console.log("🧭 [Question/Fixo] Respondendo mapas de Path of Exile sem chamar LLM porque provider não é gemini_cli.");
    return message.reply({
      content: respostaMapasPathOfExile(),
      allowedMentions: { repliedUser: false, parse: [] }
    });
  }

  try {
    const resposta = await perguntarQuestion(texto);

    return sendChunkedReply(message, resposta);
  } catch (err) {
    console.log("🔥 Erro no comando !question:", err.message);
    if (isPerguntaMapasPathOfExile(texto)) {
      console.log("🧭 [Question/Fixo] Usando resposta segura de mapas de Path of Exile após falha do provider.");
      return message.reply({
        content: respostaMapasPathOfExile(),
        allowedMentions: { repliedUser: false, parse: [] }
      });
    }
    return message.reply("⚠️ Erro no modo pergunta. Confere se o Ollama está aberto com `ollama serve`.");
  }
}

async function handleClearCommand(message, text) {
  let amount = 100;
  let mode = "bot";
  
  if (text) {
    const args = text.toLowerCase().trim().split(/\s+/);
    for (const arg of args) {
      if (arg === "cmd" || arg === "cmds") {
        mode = "cmd";
      } else {
        const parsed = parseInt(arg, 10);
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed > 100 ? 100 : parsed;
        }
      }
    }
  }

  try {
    const fetched = await message.channel.messages.fetch({ limit: amount });
    let targetMessages;
    
    if (mode === "bot") {
      targetMessages = fetched.filter(m => m.author.id === message.client.user.id);
    } else if (mode === "cmd") {
      targetMessages = fetched.filter(m => m.content.startsWith("!"));
    }
    
    if (targetMessages.size > 0) {
      try {
        await message.channel.bulkDelete(targetMessages, true);
      } catch (e) {
        for (const m of targetMessages.values()) {
          await m.delete().catch(() => {});
        }
      }
      const tipoMsg = mode === "bot" ? "minhas" : "de comandos";
      const reply = await message.channel.send(`🧹 Limpei ${targetMessages.size} mensagens ${tipoMsg}!`);
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    } else {
      const reply = await message.reply("Não encontrei nenhuma mensagem para limpar nessas últimas mensagens.");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
    
    message.delete().catch(() => {});
  } catch (err) {
    console.error("🔥 Erro no comando !clear:", err);
    message.reply("⚠️ Erro ao limpar mensagens.");
  }
}

async function handleMessage(message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  coletarGifs(message);
  cachearMensagem(message);
  maybeExtrairFofocas(message);
  checkAndSpawnEvent(message);
  checkAndSendTip(message);

  if (isPrisioneiro(message.author.id) && (isCommand(message, ["!forca", "!roubar", "!duelo", "!aventura", "!rpg", "!av"]))) {
    return message.reply("🚓 Você está na prisão! Presidiários não podem jogar Forca, Aventura, Duelos ou Roubar.");
  }

  if (checkForcaGuess(message)) {
    return;
  }

  if (isCommand(message, ["!help"])) {
    return message.reply({
      embeds: [buildHelpEmbed()],
      allowedMentions: { repliedUser: false, parse: [] }
    });
  }

  if (isCommand(message, ["!new"])) {
    return message.reply({
      embeds: [buildNewEmbed()],
      allowedMentions: { repliedUser: false, parse: [] }
    });
  }

  if (isCommand(message, ["!f"])) {
    return handleVoiceCommand(message, getCommandText(message, ["!f"]));
  }

  if (isCommand(message, ["!clear"])) {
    return handleClearCommand(message, getCommandText(message, ["!clear"]));
  }

  if (isCommand(message, ["!games"])) {
    const { handleGamesCommand } = require("./games_menu");
    return handleGamesCommand(message);
  }

  if (isCommand(message, ["!forca", "!aventura", "!rpg", "!av", "!duelo"])) {
    return message.reply("🎮 **ATUALIZAÇÃO:** Estes comandos antigos foram desativados! Digite **`!games`** para acessar todos os jogos de forma fácil no novo Fliperama!");
  }

  if (isCommand(message, ["!roubar"])) {
    return handleRoubarCommand(message, getCommandText(message, ["!roubar"]));
  }

  if (isCommand(message, ["!doar", "!trade"])) {
    const text = getCommandText(message, ["!doar", "!trade"]);
    return handleDoarCommand(message, text);
  }

  if (isCommand(message, ["!timeout"])) {
    return handleTimeoutCommand(message);
  }

  if (isCommand(message, ["!fianca", "!fiança", "!suborno"])) {
    return handleFiancaCommand(message);
  }

  if (isCommand(message, ["!parrudo"])) {
    return handleParrudoCommand(message, getCommandText(message, ["!parrudo"]));
  }

  if (isCommand(message, ["!loja", "!boost", "!boosts"])) {
    return handleBoostCommand(message);
  }

  if (isCommand(message, ["!beijarmuro", "!bejarmuro"])) {
    return handleBeijarMuroCommand(message);
  }

  if (isCommand(message, ["!daily", "!diario"])) {
    const { handleDailyCommand } = require("./inventory");
    return handleDailyCommand(message);
  }

  if (isCommand(message, ["!fliperama", "!lootbox"])) {
    const { handleFliperamaCommand } = require("./fliperama");
    return handleFliperamaCommand(message);
  }

  if (isCommand(message, ["!spawn_boss"])) {
    if (message.author.id !== "762478935615078401") {
      return message.reply("❌ Apenas o Superadmin pode usar este comando!");
    }
    const { spawnWorldBoss } = require("./boss");
    const { EVENT_CHANNELS, resetBossTimer } = require("./games");
    
    resetBossTimer(); // Reseta o contador para daqui a 12h
    
    const bossChannels = [];
    for (const channelId of EVENT_CHANNELS) {
      const bossChannel = message.client.channels.cache.get(channelId);
      if (bossChannel) bossChannels.push(bossChannel);
    }
    
    if (bossChannels.length > 0) {
      spawnWorldBoss(bossChannels);
      message.reply("✅ World Boss sumonado com sucesso em todos os canais de evento! O contador de 12h foi resetado.");
    } else {
      message.reply("❌ Não foi possível encontrar os canais de evento.");
    }
    return;
  }

  if (isCommand(message, ["!duelo_old"])) {
    return handleDueloCommand(message, getCommandText(message, ["!duelo_old"]));
  }

  if (isCommand(message, ["!saldo", "!nanacoins", "!atm", "!dinheiro"])) {
    const coins = getCoins(message.author.id);
    const topPlayers = getTopPlayers(100);
    const myRank = topPlayers.findIndex(p => p.id === message.author.id) + 1;
    const rankStr = myRank > 0 ? `#${myRank}` : 'Não rankeado';
    const { formatCoins } = require("./economy");

    const embed = new EmbedBuilder()
      .setColor('#000000') // Estilo Cartão Black
      .setTitle('💳 BANCO NANACOIN')
      .setDescription(`Extrato bancário de **${message.author.username}**`)
      .addFields(
        { name: '💵 Saldo Disponível', value: `\`🪙 ${formatCoins(coins)} Nanacoins\``, inline: true },
        { name: '🏆 Posição no Rank', value: `\`${rankStr}\``, inline: true }
      )
      .setFooter({ text: 'Dica: Use !loja para gastar ou !roubar para tentar a sorte.' });

    return message.reply({ embeds: [embed] });
  }

  if (isCommand(message, ["!rank", "!top"])) {
    const topPlayers = getTopPlayers(10);
    if (topPlayers.length === 0) {
      return message.reply("Ninguém tem dinheiro ainda. Joguem `!forca`!");
    }
    const { formatCoins } = require("./economy");
    
    let rankText = "";
    for (let i = 0; i < topPlayers.length; i++) {
      const p = topPlayers[i];
      let username = "Desconhecido";
      try {
        const user = message.client.users.cache.get(p.id) || await message.client.users.fetch(p.id);
        username = user ? user.username : p.id;
      } catch(e) {
        username = `User-${p.id.slice(-4)}`;
      }
      
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🔹";
      
      let formattedName = username;
      if (i === 0) formattedName = `👑 **${username.toUpperCase()}**`;
      else if (i === 1) formattedName = `**${username}**`;
      else if (i === 2) formattedName = `*${username}*`;
      
      rankText += `${medal} **#${i + 1}** ${formattedName} — \`${formatCoins(p.balance)} 🪙\`\n`;
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 RANKING GLOBAL - TOP 10 MAIS RICOS')
      .setDescription(rankText)
      .setFooter({ text: 'A corrida pelo dinheiro virtual está insana!' });

    return message.reply({ embeds: [embed] });
  }

  if (isCommand(message, ["!nana"])) {
    return handleTextCommand(message);
  }

  if (isCommand(message, ["!question"])) {
    return handleQuestionCommand(message);
  }

  if (isCommand(message, ["!img", "!anime"])) {
    const isAnime = isCommand(message, ["!anime"]);
    const cmd = isAnime ? "!anime" : "!img";
    const prompt = getCommandText(message, ["!img", "!anime"]);
    return handleImageCommand(message, { prompt, isAnime, cmd });
  }

  return maybeResponderEspontaneo(message);
}

function start() {
  const client = createClient();

  client.once("clientReady", () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
  });

  client.on("messageCreate", (message) => {
    handleMessage(message).catch((err) => {
      console.error("🔥 Erro inesperado no messageCreate:", err);
    });
  });
  client.on("interactionCreate", async (interaction) => {
    try {
      if (await handleEventInteraction(interaction)) return;
      if (await handleForcaThemeInteraction(interaction)) return;
      
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('boost_select_')) {
          return handleBoostInteraction(interaction);
        }
      }

      const { handleBossInteraction } = require("./boss");
      if (await handleBossInteraction(interaction)) return;

      const { handleGamesInteraction } = require("./games_menu");
      if (await handleGamesInteraction(interaction)) return;

      const { handleFliperamaInteraction } = require("./fliperama");
      if (await handleFliperamaInteraction(interaction)) return;

      // Existing handlers at the end
      handleButtonInteraction(interaction).catch((err) => {
        console.error("🔥 Erro inesperado no duelo interactionCreate:", err);
      });
      handleRpgInteraction(interaction).catch((err) => {
        console.error("🔥 Erro inesperado no rpg interactionCreate:", err);
      });

    } catch (err) {
      console.error("🔥 Erro inesperado no evento interactionCreate:", err);
    }
  });

  return client.login(config.DISCORD_TOKEN);
}

module.exports = {
  start
};

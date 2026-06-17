const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const config = require("../core/config");
const { isCommand, getCommandText } = require("../core/utils");
const { assertOllamaReady } = require("../core/services");
const { limparResposta, pedirRespostaAoOllama } = require("../ai/ollama");
const { handleVoiceCommand } = require("../voice/voice");
const { handleImageCommand } = require("../ai/image");
const {
  isPerguntaMapasPathOfExile,
  respostaMapasPathOfExile,
  perguntarQuestion
} = require("../ai/question");
const {
  coletarGifs,
  cachearMensagem,
  maybeExtrairFofocas,
  maybeResponderEspontaneo
} = require("../ai/chat");
const { handleForcaThemeInteraction, checkForcaGuess, checkAndSpawnEvent, handleEventInteraction } = require("../games/forca");
const { getCoins, getTopPlayers, handleDoarCommand } = require("../economy/economy");
const { handleRoubarCommand, handleButtonInteraction, handleTimeoutCommand, handleFiancaCommand, handleParrudoCommand, isPrisioneiro, handleBeijarMuroCommand } = require("../games/duel");
const { handleRpgInteraction } = require("../games/rpg");
const { handleBoostCommand, handleBoostInteraction } = require("../economy/boosts");
const { handleMarketCommand, handleMarketInteraction } = require("../economy/market");
const { handleInventoryCommand, handleEquipWeaponCommand } = require("../economy/weapons");
const { checkAndSendTip } = require("../features/tips");
const { handleAdminCommand } = require("../admin/admin");

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
        '`!daily` / `!diario` - 🎁 Gire a roleta diária para prêmios!',
        '`!saldo` - 💵 Verifica quanto dinheiro virtual você tem.',
        '`!rank` - 🏆 Mostra os mais ricos do servidor.',
        '`!doar <@user> <valor>` - 💸 Transfere Nanacoins simples.',
        '`!loja` - 🏪 Abre o hub de boosts, itens e armas equipáveis.',
        '`!bolsa` - 📈 Central de Negócios: compre, venda ou faça trade de itens/armas!',
        '`!inventario` / `!inv` - 🎒 Mostra seus itens e permite **equipar suas armas** interativamente.'
      ].join('\n') },
      { name: '⚔️ Crime & Duelo', value: [
        '`!roubar <@user>` - 🥷 Tenta furtar Nanacoins de alguém.',
        '`!parrudo <horas>h` - 🛡️ Imunidade a roubos. Se atacado sem Ácido, o ladrão sofre dano do Escudo de Espinhos!',
        '`!timeout` - 🚓 Verifica tempo de prisão.',
        '`!fianca [@user]` - 💸 Paga fiança para sair ou soltar amigo.',
        '`!beijarmuro` - 💋 Beija o muro e testa sua sorte.'
      ].join('\n') },
      { name: '🎮 Games & RPG', value: [
        '`!games` - 🎰 Hub central de jogos: Forca, Trivia, Duelo e **Lootboxes**!'
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
    .setTitle('🌟 NOVIDADES DA GRANDE REFORMA 🌟')
    .setDescription('O servidor voltou! O bot foi reformulado com **Armas Equipáveis, Raid Bosses Dinâmicos e um Mercado Centralizado**. Confira o que mudou:')
    .addFields(
      { name: '🐉 Boss Raid Dinâmico', value: 'O World Boss e o **Mini Boss** agora têm **Fases de Vida**, ataques, fraquezas e HP randomizado! Os visuais deles (imagens de IA) mudam a cada invocação. Use sua arma para perfurar a defesa e ganhar prêmios imensos!' },
      { name: '⚔️ Loja & Inventário 2.0', value: 'As Lootboxes foram movidas para dentro de `!games` e as armas são equipadas diretamente por botões em `!inv`. A `!loja` agora conta com UI completa com emojis de raridade para cada arma!' },
      { name: '🎒 Nova Bolsa & Transações', value: 'Comando `!bolsa` centraliza tudo! Venda seus itens e armas, compre da comunidade ou faça "Trades". Se quiser dinheiro rápido, faça a **Venda Instantânea** por 55% do valor do item direto pro bot.' },
      { name: '🛡️ Ajustes no Crime', value: [
        '💸 **Escudo de Espinhos:** Pune o ladrão *imediatamente* na hora do roubo.',
        '🧪 **Ácido:** Fura o Parrudo de primeira se você tiver a poção.'
      ].join('\n') },
      { name: '🎮 Melhorias de Jogo', value: [
        '🔐 **Lock de Dono:** Só quem usa o comando `!games` pode escolher o tema ou configurar a Forca/Trivia. Nada de roubarem seu menu!',
        '📚 **Novos Temas:** Forca e Show do Milhão ganharam **10 temas novos** e seleção de rodadas.'
      ].join('\n') }
    )
    .setImage('https://media.tenor.com/XqT7hS_m4_kAAAAC/hype-train.gif') // Gif chamativo de hype
    .setFooter({ text: 'Bem-vindos a nova era da Economia! Usem !help para ver os comandos.' });
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

  if (isPrisioneiro(message.author.id) && isCommand(message, ["!roubar", "!games"])) {
    return message.reply("🚓 Você está na prisão! Presidiários não podem jogar, duelar ou roubar.");
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
    const { handleGamesCommand } = require("../games/menu");
    return handleGamesCommand(message);
  }

  if (isCommand(message, ["!roubar"])) {
    return handleRoubarCommand(message, getCommandText(message, ["!roubar"]));
  }

  if (isCommand(message, ["!doar"])) {
    const text = getCommandText(message, ["!doar"]);
    return handleDoarCommand(message, text);
  }

  if (isCommand(message, ["!trade"])) {
    return message.reply("Use `!bolsa` para negociar itens e armas.");
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

  if (isCommand(message, ["!bolsa"])) {
    return handleMarketCommand(message);
  }

  if (isCommand(message, ["!inventario", "!inv"])) {
    return handleInventoryCommand(message);
  }

  if (isCommand(message, ["!equipar"])) {
    return handleEquipWeaponCommand(message, getCommandText(message, ["!equipar"]));
  }

  if (isCommand(message, ["!beijarmuro", "!bejarmuro"])) {
    return handleBeijarMuroCommand(message);
  }

  if (isCommand(message, ["!daily", "!diario"])) {
    const { handleDailyCommand } = require("../economy/inventory");
    return handleDailyCommand(message);
  }

  if (isCommand(message, ["!fliperama", "!lootbox"])) {
    const { handleFliperamaCommand } = require("../economy/fliperama");
    return handleFliperamaCommand(message);
  }

  if (await handleAdminCommand(message)) return;

  if (isCommand(message, ["!saldo", "!nanacoins", "!atm", "!dinheiro"])) {
    const coins = getCoins(message.author.id);
    const topPlayers = getTopPlayers(100);
    const myRank = topPlayers.findIndex(p => p.id === message.author.id) + 1;
    const rankStr = myRank > 0 ? `#${myRank}` : 'Não rankeado';
    const { formatCoins } = require("../economy/economy");

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
      return message.reply("Ninguém tem dinheiro ainda. Abram `!games` e joguem alguma coisa!");
    }
    const { formatCoins } = require("../economy/economy");
    
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
      
      if (await handleMarketInteraction(interaction)) return;

      if (
        interaction.customId?.startsWith('boost_select_')
        || interaction.customId?.startsWith('shop_cat_')
        || interaction.customId?.startsWith('weapon_select_')
      ) {
        await handleBoostInteraction(interaction);
        return;
      }

      const { handleInventoryInteraction } = require("../economy/weapons");
      if (await handleInventoryInteraction(interaction)) return;

      const { handleBossInteraction } = require("../games/boss");
      if (await handleBossInteraction(interaction)) return;

      const { handleGamesInteraction } = require("../games/menu");
      if (await handleGamesInteraction(interaction)) return;

      const { handleFliperamaInteraction } = require("../economy/fliperama");
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

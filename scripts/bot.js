const { Client, GatewayIntentBits } = require("discord.js");
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
const { handleForcaCommand, handleForcaThemeInteraction, checkForcaGuess, checkAndSpawnEvent, handleEventInteraction } = require("./games");
const { getCoins, getTopPlayers, handleDoarCommand } = require("./economy");
const { handleRoubarCommand, handleDueloCommand, handleButtonInteraction, handleTimeoutCommand, handleFiancaCommand, handleParrudoCommand, isPrisioneiro } = require("./duel");
const { handleAventuraCommand, handleRpgInteraction } = require("./rpg");
const { handleBoostCommand, handleBoostInteraction } = require("./boosts");

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

function buildHelpText() {
  return [
    "🤖 **Comandos do Nana** 🍌",
    "ℹ️ `!help` - mostra esta lista.",
    "✨ `!new` - mostra as últimas atualizações do bot.",
    "💰 `!saldo` / `!nanacoins` - verifica quanto dinheiro virtual você tem.",
    "🏆 `!rank` - mostra os mais ricos do servidor.",
    "💰 `!doar <@user> <valor>` - transfere Nanacoins para outro jogador.",
    "🛡️ `!parrudo <horas>h` - compra imunidade a roubos por X horas.",
    "🚀 `!boost` - abre a loja clandestina para multiplicar ganhos ou melhorar roubo.",
    "🚓 `!timeout` - verifica quanto tempo falta para sair da prisão.",
    "💸 `!fianca` - paga 250 Nanacoins para sair da prisão.",
    "⚔️ `!duelo <@user> <valor>` - trava uma batalha tática valendo moedas.",
    "🎯 `!roubar <@user>` - tenta furtar Nanacoins de alguém (50% de chance).",
    "🌌 `!aventura` (ou `!rpg`, `!av`) - RPG do multiverso e Show do Milhão.",
    "🎮 `!forca` - inicia o jogo da Forca da IA.",
    "💬 `!nana <texto>` - conversa com a IA no modo casual/persona.",
    "🧠 `!question <pergunta>` - pergunta séria, resposta profissional.",
    `  ⚙️ Provedor atual do !question: \`${config.QUESTION_PROVIDER === "gemini_cli" ? "Gemini CLI com fallback local" : "Ollama local"}\`.`,
    "🖼️ `!img <prompt>` - gera imagem realista pelo Forge.",
    "🌸 `!anime <prompt>` - gera imagem em estilo anime pelo Forge.",
    "🔊 `!f <texto>` - fala no canal de voz onde você está.",
    "🧹 `!clear [cmd] <num>` - apaga mensagens do bot ou comandos de usuários.",
    "",
    "🐒 *Também respondo quando me mencionam ou falam `nana` / `botbanana` como palavra separada.*"
  ].join("\n");
}

function buildNewText() {
  return [
    "**Últimas Atualizações do Nana V3.2 (Otimizado e Turbinado):**",
    "🚀 **Loja Clandestina (`!boost`):** Agora você pode comprar multiplicadores de 2x, 3x e 4x para Forca e Show do Milhão, além de aumentar sua chance de roubo!",
    "🛡️ **Parrudo por Horas (`!parrudo`):** Chega de só 2 horinhas! Agora você pode comprar pacotes de `2h` (500), `5h` (1k) ou `10h` (5k) de proteção.",
    "⚡ **Motor Refatorado:** Toda a economia do bot foi reescrita para salvar em background e não travar o servidor. Fim dos lags!",
    "💸 **Fiança (`!fianca`):** A fiança baixou! Agora custa apenas 250 Nanacoins para subornar o delegado e sair da prisão.",
    "🥷 **Busca Global (`!roubar`):** O comando de roubar agora localiza jogadores de outros servidores pelo *Display Name*.",
    "🎁 **Eventos Aleatórios:** A cada 2 horas surge um baú no chat que dá 200 Nanacoins pro primeiro que pegar!",
    "🌌 **Hub do Multiverso (`!rpg`, `!av`):** Motor de RPG gerado 100% por IA com IA Juíza e Show do Milhão com imagens geradas na hora."
  ].join("\n");
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
    console.error("🔥 Erro no comando de texto:", err);
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
    console.error("🔥 Erro no comando !question:", err);
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

  if (isPrisioneiro(message.author.id) && (isCommand(message, ["!forca", "!roubar", "!duelo", "!aventura", "!rpg", "!av"]))) {
    return message.reply("🚓 Você está na prisão! Presidiários não podem jogar Forca, Aventura, Duelos ou Roubar.");
  }

  if (checkForcaGuess(message)) {
    return;
  }

  if (isCommand(message, ["!help"])) {
    return message.reply({
      content: buildHelpText(),
      allowedMentions: { repliedUser: false, parse: [] }
    });
  }

  if (isCommand(message, ["!new"])) {
    return message.reply({
      content: buildNewText(),
      allowedMentions: { repliedUser: false, parse: [] }
    });
  }

  if (isCommand(message, ["!f"])) {
    return handleVoiceCommand(message, getCommandText(message, ["!f"]));
  }

  if (isCommand(message, ["!clear"])) {
    return handleClearCommand(message, getCommandText(message, ["!clear"]));
  }

  if (isCommand(message, ["!forca"])) {
    return handleForcaCommand(message);
  }

  if (isCommand(message, ["!aventura", "!rpg", "!av"])) {
    return handleAventuraCommand(message);
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

  if (isCommand(message, ["!boost", "!boosts", "!loja"])) {
    return handleBoostCommand(message);
  }

  if (isCommand(message, ["!duelo"])) {
    return handleDueloCommand(message, getCommandText(message, ["!duelo"]));
  }

  if (isCommand(message, ["!saldo", "!nanacoins", "!atm", "!dinheiro"])) {
    const coins = getCoins(message.author.id);
    return message.reply(`💰 Você tem **${coins} Nanacoins 🪙** na sua conta! Ganhe mais jogando \`!rpg\`, \`!forca\` ou tente a sorte com \`!roubar\`.`);
  }

  if (isCommand(message, ["!rank", "!top"])) {
    const topPlayers = getTopPlayers(15);
    if (topPlayers.length === 0) {
      return message.reply("Ninguém tem dinheiro ainda. Joguem `!forca`!");
    }
    
    let rankText = "🏆 **RANKING GLOBAL - TOP 15 MAIS RICOS** 🏆\n\n";
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
      
      if (i < 3) {
        rankText += `${medal} **#${i + 1}** ${formattedName} — **${p.balance}** Nanacoins 🪙\n`;
      } else {
        rankText += `${medal} #${i + 1} ${formattedName} — ${p.balance} Nanacoins 🪙\n`;
      }
    }
    
    rankText += "\n💸 Suba no rank vencendo \`!duelo\`, apostando no \`!rpg\` ou limpando os bolsos com \`!roubar\`!";
    return message.reply(rankText);
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
        if (interaction.customId === 'boost_select') {
          return handleBoostInteraction(interaction);
        }
      }

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

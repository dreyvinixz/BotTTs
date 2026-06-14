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
const { handleForcaCommand, checkForcaGuess } = require("./games");
const { getCoins, getTopPlayers } = require("./economy");
const { handleRoubarCommand, handleDueloCommand, handleButtonInteraction, isPrisioneiro } = require("./duel");
const { handleAventuraCommand, handleRpgInteraction } = require("./rpg");

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
    "🥷 `!roubar @user` - tenta roubar Nanacoins. Se falhar, você vai preso!",
    "⚔️ `!duelo @user <valor>` - inicia um combate tático com apostas.",
    "🌌 `!aventura` (ou `!rpg`, `!av`) - RPG do multiverso (Modo Improviso e Enigma!).",
    "🎮 `!forca` - inicia o jogo da Forca da IA.",
    "💬 `!nana <texto>` - conversa com a IA no modo casual/persona.",
    "🧠 `!question <pergunta>` - pergunta séria, resposta profissional.",
    `  ⚙️ Provedor atual do !question: \`${config.QUESTION_PROVIDER === "gemini_cli" ? "Gemini CLI com fallback local" : "Ollama local"}\`.`,
    "🖼️ `!img <prompt>` - gera imagem realista pelo Forge.",
    "🌸 `!anime <prompt>` - gera imagem em estilo anime pelo Forge.",
    "🔊 `!f <texto>` - fala no canal de voz onde você está.",
    "",
    "🐒 *Também respondo quando me mencionam ou falam `nana` / `botbanana` como palavra separada.*"
  ].join("\n");
}

function buildNewText() {
  return [
    "**Últimas Atualizações do Nana V3.0 (O Multiverso):**",
    "🪙 **Economia Global:** Ganhe *Nanacoins 🪙* conversando e interagindo. Use `!saldo` e `!rank` para ver sua riqueza.",
    "🌌 **[NOVO] Hub do Multiverso (`!rpg`, `!av`, `!aventura`):** Um novo motor de RPG visual gerado 100% por IA (Ollama + Forge).",
    "  🎭 **Improviso:** A IA cria o cenário e vocês escrevem secretamente ações criativas para o grupo votar na melhor!",
    "  🕵️‍♂️ **Enigma Visual:** A IA desenha um absurdo e esconde o texto. Você deve adivinhar o que a imagem significa!",
    "🔥 **[NOVO] Dificuldades do Multiverso:** Fácil, Médio, Difícil e modo **Infernal** (cruel, onde errar te faz perder moedas).",
    "🎮 **Arcade Clássico (`!forca`):** Jogue o clássico da Forca da IA. (Cuidado: errar a palavra de propósito tira 30 🪙!).",
    "⚔️ **Guerra e Caos:** Desafie amigos com `!duelo` (Pedra-Papel-Tesoura com botões) ou tente a sorte com `!roubar`.",
    "🚓 **Prisão Virtual:** Se falhar num roubo, ficará sem poder jogar por 30 minutos."
  ].join("\n");
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

    return message.reply({
      content: resposta || "Não consegui montar uma resposta.",
      allowedMentions: { repliedUser: false, parse: [] }
    });
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

    return message.reply({
      content: resposta || "Não consegui montar uma resposta.",
      allowedMentions: { repliedUser: false, parse: [] }
    });
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

async function handleMessage(message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  coletarGifs(message);
  cachearMensagem(message);
  maybeExtrairFofocas(message);

  if (isPrisioneiro(message.author.id) && (isCommand(message, ["!forca", "!roubar", "!duelo", "!aventura", "!rpg", "!av"]) || checkForcaGuess(message))) {
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

  if (isCommand(message, ["!forca"])) {
    return handleForcaCommand(message);
  }

  if (isCommand(message, ["!aventura", "!rpg", "!av"])) {
    return handleAventuraCommand(message);
  }

  if (isCommand(message, ["!roubar"])) {
    return handleRoubarCommand(message, getCommandText(message, ["!roubar"]));
  }

  if (isCommand(message, ["!duelo"])) {
    return handleDueloCommand(message, getCommandText(message, ["!duelo"]));
  }

  if (isCommand(message, ["!saldo", "!nanacoins", "!atm", "!dinheiro"])) {
    const coins = getCoins(message.author.id);
    return message.reply(`💰 Você tem **${coins} Nanacoins 🪙** na sua conta! Jogue \`!forca\` para ganhar mais.`);
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
    
    rankText += "\n💰 Jogue `!forca` ou converse no chat para subir no rank!";
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
  client.on("interactionCreate", (interaction) => {
    handleButtonInteraction(interaction).catch((err) => {
      console.error("🔥 Erro inesperado no duelo interactionCreate:", err);
    });
    handleRpgInteraction(interaction).catch((err) => {
      console.error("🔥 Erro inesperado no rpg interactionCreate:", err);
    });
  });

  return client.login(config.DISCORD_TOKEN);
}

module.exports = {
  start
};

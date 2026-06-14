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
    "**Comandos da Nana**",
    "`!help` / `!ajuda` / `!comandos` - mostra esta lista.",
    "`!ia <texto>` / `!llm <texto>` / `!texto <texto>` - conversa com a IA no modo casual/persona.",
    "`!question <pergunta>` / `!pergunta <pergunta>` / `!q <pergunta>` - pergunta séria, resposta profissional.",
    `  Provedor atual do !question: \`${config.QUESTION_PROVIDER === "gemini_cli" ? "Gemini CLI com fallback local" : "Ollama local"}\`.`,
    "`!imagem <prompt>` / `!img <prompt>` / `!image <prompt>` - gera imagem realista pelo Forge.",
    "`!anime <prompt>` - gera imagem em estilo anime pelo Forge.",
    "`!voz <texto>` / `!f <texto>` / `!voice <texto>` - fala no canal de voz onde você está.",
    "",
    "Também respondo quando me mencionam ou falam `nana` / `botbanana` como palavra separada."
  ].join("\n");
}

async function handleTextCommand(message) {
  const texto = getCommandText(message, ["!ia", "!llm", "!texto"]);
  if (!texto) {
    return message.reply("Digite uma pergunta: `!ia me explica isso aqui`");
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
  const texto = getCommandText(message, ["!question", "!pergunta", "!q"]);
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

  if (isCommand(message, ["!help", "!ajuda", "!comandos"])) {
    return message.reply({
      content: buildHelpText(),
      allowedMentions: { repliedUser: false, parse: [] }
    });
  }

  if (isCommand(message, ["!f", "!voz", "!voice"])) {
    return handleVoiceCommand(message, getCommandText(message, ["!f", "!voz", "!voice"]));
  }

  if (isCommand(message, ["!ia", "!llm", "!texto"])) {
    return handleTextCommand(message);
  }

  if (isCommand(message, ["!question", "!pergunta", "!q"])) {
    return handleQuestionCommand(message);
  }

  if (isCommand(message, ["!image", "!imagem", "!img", "!anime"])) {
    const isAnime = isCommand(message, ["!anime"]);
    const cmd = isAnime ? "!anime" : "!imagem";
    const prompt = getCommandText(message, ["!image", "!imagem", "!img", "!anime"]);
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

  return client.login(config.DISCORD_TOKEN);
}

module.exports = {
  start
};

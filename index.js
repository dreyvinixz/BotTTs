require("dotenv").config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");

// --- NOVAS IMPORTAÇÕES DO GOOGLE CLOUD ---
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");
const { execFile } = require("child_process");
// -----------------------------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- CLIENTES DE TTS ---
const googleClient = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? new TextToSpeechClient()
  : null;
const writeFile = util.promisify(fs.writeFile);
const execFileAsync = util.promisify(execFile);
let skipGoogleTts = false;

function getEnvNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function getEnvString(name, fallback) {
  return process.env[name] || fallback;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const DATA_DIR = path.resolve(__dirname, getEnvString("DATA_DIR", "data"));
ensureDir(DATA_DIR);

const GIFS_PATH = path.resolve(__dirname, getEnvString("GIFS_PATH", path.join("data", "gifs.json")));
const FOFOCAS_PATH = path.resolve(__dirname, getEnvString("FOFOCAS_PATH", path.join("data", "fofocas.json")));
ensureDir(path.dirname(GIFS_PATH));
ensureDir(path.dirname(FOFOCAS_PATH));
const DEFAULT_GIF_URL = getEnvString("DEFAULT_GIF_URL", "https://media.tenor.com/Z4cOQWc-DscAAAAC/banana.gif");
const POLITICAS_PATH = path.resolve(__dirname, getEnvString("POLITICAS_PATH", "politicas.txt"));
const POLITICAS_IMAGEM_PATH = path.resolve(__dirname, getEnvString("POLITICAS_IMAGEM_PATH", "politicas_imagem.txt"));

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:1.7b";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const FORGE_HOST = process.env.FORGE_HOST || "http://127.0.0.1:7860";
const EDGE_TTS_VOICE = getEnvString("EDGE_TTS_VOICE", "pt-BR-AntonioNeural");
const GOOGLE_TTS_LANGUAGE_CODE = getEnvString("GOOGLE_TTS_LANGUAGE_CODE", "pt-BR");
const GOOGLE_TTS_VOICE = getEnvString("GOOGLE_TTS_VOICE", "pt-BR-Wavenet-A");
const VOICE_IDLE_TIMEOUT_MS = getEnvNumber("VOICE_IDLE_TIMEOUT_MS", 300_000);
const QUESTION_PROVIDER = (process.env.QUESTION_PROVIDER || "local").toLowerCase();
const GEMINI_CLI_MODEL = (process.env.GEMINI_CLI_MODEL || "auto").toLowerCase();
const GEMINI_CLI_TIMEOUT_MS = getEnvNumber("GEMINI_CLI_TIMEOUT_MS", 120_000);

const CHANCE_RESPONDER_PERGUNTA = getEnvNumber("CHANCE_RESPONDER_PERGUNTA", 0.12);
const CHANCE_RESPONDER_CASUAL = getEnvNumber("CHANCE_RESPONDER_CASUAL", 0.003);
const CHANCE_RESPONDER_MIDIA = getEnvNumber("CHANCE_RESPONDER_MIDIA", 0.10);
const COOLDOWN_USUARIO_MS = getEnvNumber("COOLDOWN_USUARIO_MS", 120_000);
const COOLDOWN_CANAL_MS = getEnvNumber("COOLDOWN_CANAL_MS", 60_000);
const OLLAMA_TIMEOUT_MS = getEnvNumber("OLLAMA_TIMEOUT_MS", 30_000);
const OLLAMA_NUM_PREDICT = getEnvNumber("OLLAMA_NUM_PREDICT", 120);
const OLLAMA_TEMPERATURE = getEnvNumber("OLLAMA_TEMPERATURE", 0.6);
const OLLAMA_TOP_K = getEnvNumber("OLLAMA_TOP_K", 40);
const OLLAMA_TOP_P = getEnvNumber("OLLAMA_TOP_P", 0.9);
const OLLAMA_REPEAT_PENALTY = getEnvNumber("OLLAMA_REPEAT_PENALTY", 1.15);

const CHAT_CACHE_LIMIT = getEnvNumber("CHAT_CACHE_LIMIT", 100);
const CONTEXT_HISTORY_LIMIT = getEnvNumber("CONTEXT_HISTORY_LIMIT", 6);
const FOFOCA_MIN_MESSAGES = getEnvNumber("FOFOCA_MIN_MESSAGES", 50);
const FOFOCA_MAX_ITEMS = getEnvNumber("FOFOCA_MAX_ITEMS", 30);
const GIF_COOLDOWN_MS = getEnvNumber("GIF_COOLDOWN_MS", 180_000);
const TEMP_ERROR_DELETE_MS = getEnvNumber("TEMP_ERROR_DELETE_MS", 5_000);

const FORGE_REALISTIC_MODEL = getEnvString("FORGE_REALISTIC_MODEL", "DreamShaper_8_pruned.safetensors");
const FORGE_ANIME_MODEL = getEnvString("FORGE_ANIME_MODEL", "MeinaMix_V11.safetensors");
const FORGE_STEPS = getEnvNumber("FORGE_STEPS", 25);
const FORGE_WIDTH = getEnvNumber("FORGE_WIDTH", 512);
const FORGE_HEIGHT = getEnvNumber("FORGE_HEIGHT", 512);
const FORGE_SAMPLER = getEnvString("FORGE_SAMPLER", "Euler a");
const FORGE_BATCH_SIZE = getEnvNumber("FORGE_BATCH_SIZE", 1);
const FORGE_REALISTIC_NEGATIVE_PROMPT = getEnvString("FORGE_REALISTIC_NEGATIVE_PROMPT", "ugly, low quality, bad anatomy, deformed, watermark, text, extra fingers, mutated hands, poorly drawn, blurry, artifacts, cluttered background, messy composition");
const FORGE_ANIME_NEGATIVE_PROMPT = getEnvString("FORGE_ANIME_NEGATIVE_PROMPT", "ugly, low quality, bad anatomy, deformed, poorly drawn face, poorly drawn hands, missing fingers, missing limbs, cluttered background, messy composition, watermark, text, blurry");

// Memória RAM ultra-rápida (totalmente interna/privada, não envia para o Discord nem para a nuvem)
const chatCache = new Map();
let ultimoGifEnviado = 0; // Limite de spam de GIFs
let mensagemCountFofoca = 0; // Contador para a Fofoqueira

const userCooldown = new Map();
const channelCooldown = new Map();
const voiceSessions = new Map();
let lastOllamaStats = null;

function lerPoliticasDono() {
  try {
    return fs.readFileSync(POLITICAS_PATH, "utf-8").trim();
  } catch (e) {
    console.warn(`⚠️ ${path.basename(POLITICAS_PATH)} não encontrado ou não pôde ser lido.`);
    return "";
  }
}

function aplicarPoliticasDono(messages) {
  const politicas = lerPoliticasDono();
  if (!politicas) return messages;

  return [
    {
      role: "system",
      content: `Configuração principal do dono do bot. Siga estas regras antes de qualquer outra instrução:\n\n${politicas}`
    },
    ...messages
  ];
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateWithGoogle(text, filePath) {
  console.log("🎤 Gerando áudio com Google Cloud...");

  const request = {
    input: { text },
    voice: { languageCode: GOOGLE_TTS_LANGUAGE_CODE, name: GOOGLE_TTS_VOICE },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await googleClient.synthesizeSpeech(request);
  await writeFile(filePath, response.audioContent, 'binary');
  return "Google Cloud";
}

async function generateWithEdgeTts(text, filePath) {
  console.log("🎤 Gerando áudio com Microsoft Edge TTS...");

  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bottts-"));

  try {
    await tts.setMetadata(EDGE_TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(tempDir, escapeXml(text));
    await fs.promises.copyFile(audioFilePath, filePath);
    return "Microsoft Edge TTS";
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

function isBillingDisabledError(err) {
  return err?.reason === "BILLING_DISABLED"
    || /billing/i.test(err?.details || err?.message || "");
}

async function generateSpeech(text, filePath) {
  if (googleClient && !skipGoogleTts) {
    try {
      return await generateWithGoogle(text, filePath);
    } catch (err) {
      if (isBillingDisabledError(err)) {
        skipGoogleTts = true;
      }

      console.warn("⚠️ Google Cloud TTS falhou; usando fallback:", err.message);
    }
  }

  return generateWithEdgeTts(text, filePath);
}
// -----------------------

function isCommand(message, commands) {
  const content = message.content.trim().toLowerCase();
  return commands.some((cmd) => content === cmd || content.startsWith(`${cmd} `));
}

function getCommandText(message, commands) {
  const raw = message.content.trim();
  const lower = raw.toLowerCase();
  const cmd = commands.find((candidate) => lower === candidate || lower.startsWith(`${candidate} `));
  return cmd ? raw.slice(cmd.length).trim() : "";
}

function isPerguntaMapasPathOfExile(texto) {
  const lower = texto.toLowerCase();
  return /path\s*of\s*exile|\\bpoe\\b/.test(lower)
    && /mapa|mapas|atlas/.test(lower)
    && /todos|todas|lista|quais|completo|completa/.test(lower);
}

function respostaMapasPathOfExile() {
  return [
    "A lista completa de mapas de Path of Exile muda conforme a versão/liga e a rotação do Atlas, então eu não vou inventar nomes aqui.",
    "O jeito certo de ver todos é pelo Atlas dentro do jogo ou por uma fonte atualizada como PoE Wiki/PoEDB filtrando a versão atual.",
    "O que dá para explicar com segurança: mapas são o endgame do Atlas, têm tiers, layouts, bosses, modificadores, progressão por Voidstones/watchstones dependendo da versão, e servem para farm, bosses e completar objetivos do Atlas."
  ].join("\n");
}

function montarPromptQuestion(texto) {
  return `
Você está em modo suporte sério e profissional.
Responda como uma LLM assistente útil, clara e objetiva.
Você está respondendo uma pergunta de um usuário no Discord, não analisando um projeto de código.
Não mencione BotTTs, arquivos locais, discord.js, estrutura do repositório ou manutenção do bot, a menos que a pergunta peça isso explicitamente.
Não use sarcasmo, deboche, insultos, personagem de Discord, zoeira ou GIF.
Não invente nomes próprios, mapas, itens, personagens, versões, fontes ou dados específicos.
Se não tiver certeza de um nome específico, diga que não tem certeza em vez de chutar.
Se a pergunta pedir uma lista grande ou que muda com atualizações, avise que a lista completa pode variar por versão/liga e dê uma resposta segura.
Se pedirem "todos" os itens/mapas de um jogo e você não tiver certeza da lista completa atual, não fabrique uma lista. Explique o limite e ofereça categorias, exemplos confiáveis ou o melhor caminho para verificar.
Para Path of Exile: não invente mapas. Se perguntarem todos os mapas, explique que a rotação/lista do Atlas muda por liga/versão e que a lista exata deve ser consultada no Atlas do jogo, PoE Wiki ou fontes atualizadas. Pode falar com segurança sobre conceitos como Atlas, mapas, tiers, bosses, ligas, gemas, árvore passiva, ascendancies, crafting e trade.
Se não tiver certeza de algo que pode mudar com atualizações, diga isso de forma direta e ainda ajude com o que sabe.
Responda em português do Brasil.

Pergunta do usuário:
${texto}
`.trim();
}

function limparAvisosGeminiCli(texto) {
  return (texto || "")
    .split(/\r?\n/)
    .filter((line) => !/^Warning:/i.test(line.trim()))
    .filter((line) => !/^Ripgrep is not available/i.test(line.trim()))
    .join("\n")
    .trim();
}

function logGeminiTokenStats(stats) {
  const models = stats?.models || {};
  const entries = Object.entries(models);

  if (entries.length === 0) {
    console.log("📊 [Question/Gemini CLI] Tokens: stats indisponíveis.");
    return;
  }

  for (const [model, data] of entries) {
    const tokens = data.tokens || {};
    const api = data.api || {};
    console.log(
      `📊 [Question/Gemini CLI] ${model}: ` +
      `prompt=${tokens.prompt ?? "?"}, input=${tokens.input ?? "?"}, ` +
      `output=${tokens.candidates ?? "?"}, thoughts=${tokens.thoughts ?? 0}, ` +
      `cached=${tokens.cached ?? 0}, total=${tokens.total ?? "?"}, ` +
      `requests=${api.totalRequests ?? "?"}, errors=${api.totalErrors ?? "?"}`
    );
  }

  console.log("📊 [Question/Gemini CLI] Restante/cota diária: o Gemini CLI não expõe saldo restante no output; só consumo desta chamada.");
}

function logOllamaTokenStats(scope = "Question/Ollama Local") {
  if (!lastOllamaStats) {
    console.log(`📊 [${scope}] Tokens: stats indisponíveis.`);
    return;
  }

  console.log(
    `📊 [${scope}] ${lastOllamaStats.model}: ` +
    `prompt=${lastOllamaStats.promptTokens ?? "?"}, ` +
    `output=${lastOllamaStats.outputTokens ?? "?"}, ` +
    `total=${lastOllamaStats.totalTokens ?? "?"}, ` +
    `totalDuration=${lastOllamaStats.totalDurationMs ?? "?"}ms`
  );
}

async function perguntarGeminiCli(texto) {
  const startTime = Date.now();
  console.log(`❓ [Question/Gemini CLI] Iniciando. Modelo: ${GEMINI_CLI_MODEL || "auto"}. Pergunta: "${texto.slice(0, 140)}"`);

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bottts-gemini-"));
  const promptPath = path.join(tempDir, "prompt.txt");
  await fs.promises.writeFile(promptPath, montarPromptQuestion(texto), "utf-8");

  const modelArgs = GEMINI_CLI_MODEL && GEMINI_CLI_MODEL !== "auto"
    ? ` --model ${JSON.stringify(GEMINI_CLI_MODEL)}`
    : "";
  const command = [
    "$prompt = Get-Content -Raw -LiteralPath $env:BOT_TTS_GEMINI_PROMPT",
    `$prompt | gemini --skip-trust${modelArgs} --prompt " " --output-format json`
  ].join("; ");

  let stdout = "";
  let stderr = "";
  try {
    const result = await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command
    ], {
      cwd: os.tmpdir(),
      env: {
        ...process.env,
        BOT_TTS_GEMINI_PROMPT: promptPath
      },
      timeout: GEMINI_CLI_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => null);
  }

  const jsonOutput = limparAvisosGeminiCli(stdout);
  let parsed = null;
  try {
    parsed = JSON.parse(jsonOutput);
  } catch (err) {
    throw new Error(`Gemini CLI retornou JSON inválido: ${err.message}`);
  }

  const output = (parsed.response || "").trim();
  if (!output) {
    throw new Error((stderr || "Gemini CLI não retornou resposta.").trim());
  }
  if (/BotTTs|discord\.js|@discordjs|fofocas\.json|gifs\.json|Stable Diffusion|Forge WebUI/i.test(output)
    && !/BotTTs|discord|bot|c[oó]digo|projeto|reposit[oó]rio/i.test(texto)) {
    throw new Error("Gemini CLI respondeu sobre o projeto local em vez da pergunta.");
  }

  const latency = Date.now() - startTime;
  console.log(`✅ [Question/Gemini CLI] Resposta recebida em ${latency}ms (${output.length} chars).`);
  logGeminiTokenStats(parsed.stats);
  return output;
}

async function perguntarQuestionLocal(texto) {
  console.log(`❓ [Question/Ollama Local] Usando fallback/local. Pergunta: "${texto.slice(0, 140)}"`);
  await assertOllamaReady();
  const startTime = Date.now();
  const resposta = limparResposta(await pedirRespostaAoOllama([
    { role: "system", content: montarPromptQuestion("") },
    { role: "user", content: texto }
  ], {
    usarPoliticasDono: false,
    generationOptions: {
      temperature: 0.25,
      num_predict: 260
    }
  }));
  const latency = Date.now() - startTime;
  console.log(`✅ [Question/Ollama Local] Resposta recebida em ${latency}ms (${resposta.length} chars).`);
  logOllamaTokenStats();
  return resposta;
}

async function perguntarQuestion(texto) {
  console.log(`❓ [Question] Provider configurado: ${QUESTION_PROVIDER}`);
  if (QUESTION_PROVIDER === "gemini_cli") {
    try {
      return limparResposta(await perguntarGeminiCli(texto));
    } catch (err) {
      console.warn(`⚠️ [Question/Gemini CLI] Falhou; usando Ollama local. Erro: ${err.message}`);
    }
  }

  return perguntarQuestionLocal(texto);
}

async function assertLocalService(url, name) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const serviceRoot = new URL(url).origin;

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${name} respondeu status ${response.status}`);
    }
  } catch (err) {
    throw new Error(`${name} não está aberto em ${serviceRoot}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function assertOllamaReady() {
  await assertLocalService(`${OLLAMA_HOST}/api/tags`, "Ollama");
}

async function assertForgeReady() {
  await assertLocalService(`${FORGE_HOST}/sdapi/v1/options`, "Forge WebUI");
}

function scheduleVoiceLeave(guildId) {
  const session = voiceSessions.get(guildId);
  if (!session) return;

  clearTimeout(session.leaveTimer);
  session.leaveTimer = setTimeout(() => {
    const current = voiceSessions.get(guildId);
    if (!current) return;

    const elapsedSinceUse = Date.now() - current.lastUsedAt;
    if (elapsedSinceUse < VOICE_IDLE_TIMEOUT_MS || current.player.state.status !== AudioPlayerStatus.Idle) {
      scheduleVoiceLeave(guildId);
      return;
    }

    current.connection.destroy();
    voiceSessions.delete(guildId);
    console.log(`👋 Saí do canal de voz por inatividade (${VOICE_IDLE_TIMEOUT_MS / 1000}s).`);
  }, VOICE_IDLE_TIMEOUT_MS);
}

function getVoiceSession(message) {
  const guildId = message.guild.id;
  const channelId = message.member.voice.channel.id;
  const existing = voiceSessions.get(guildId);

  if (existing && existing.channelId === channelId) {
    clearTimeout(existing.leaveTimer);
    existing.lastUsedAt = Date.now();
    return existing;
  }

  if (existing) {
    clearTimeout(existing.leaveTimer);
    existing.connection.destroy();
    voiceSessions.delete(guildId);
  }

  const connection = joinVoiceChannel({
    channelId,
    guildId,
    adapterCreator: message.guild.voiceAdapterCreator
  });
  const player = createAudioPlayer();
  connection.subscribe(player);

  const session = { channelId, connection, player, leaveTimer: null, lastUsedAt: Date.now() };
  voiceSessions.set(guildId, session);
  return session;
}

function markVoiceInUse(message) {
  const existing = voiceSessions.get(message.guild.id);
  if (!existing) return;

  clearTimeout(existing.leaveTimer);
  existing.lastUsedAt = Date.now();
}

function passouCooldown(message) {
  const agora = Date.now();
  const ultimoUser = userCooldown.get(message.author.id) || 0;
  const ultimoCanal = channelCooldown.get(message.channel.id) || 0;

  if (agora - ultimoUser < COOLDOWN_USUARIO_MS) return false;
  if (agora - ultimoCanal < COOLDOWN_CANAL_MS) return false;

  userCooldown.set(message.author.id, agora);
  channelCooldown.set(message.channel.id, agora);
  return true;
}

function limparResposta(texto) {
  return texto
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/@everyone/g, "everyone")
    .replace(/@here/g, "here")
    .trim();
}

function limparIdeiaImagem(texto) {
  return texto
    .replace(/^\s*(gere|gera|crie|cria|faça|faca|desenhe|desenha|generate|create|make|draw)\s+(uma?\s+)?(imagem|foto|desenho|arte|picture|image|photo)\s+(de|do|da|com|about|of)?\s*/i, "")
    .trim();
}

function limparPromptImagem(texto) {
  return limparResposta(texto)
    .replace(/^```(?:json|txt)?/i, "")
    .replace(/```$/i, "")
    .replace(/^prompt\s*[:=-]\s*/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function promptFallbackImagem(ideia, isAnime) {
  const base = limparIdeiaImagem(ideia) || ideia;

  if (isAnime) {
    return `masterpiece anime art, ${base}, clean composition, vibrant colors, detailed, best quality`;
  }

  return `professional realistic photo, ${base}, sharp focus, natural lighting, high detail`;
}

function lerPoliticasImagem() {
  try {
    return fs.readFileSync(POLITICAS_IMAGEM_PATH, "utf-8").trim();
  } catch (e) {
    console.warn(`⚠️ ${path.basename(POLITICAS_IMAGEM_PATH)} não encontrado ou não pôde ser lido.`);
    return "";
  }
}

async function melhorarPromptImagem(ideiaOriginal, isAnime) {
  const ideia = limparIdeiaImagem(ideiaOriginal);
  const estilo = isAnime ? "anime illustration" : "realistic photography";
  const politicasImagem = lerPoliticasImagem();

  const systemPrompt = `
You are a Stable Diffusion prompt engineer.
Your job is to transform short Portuguese or English image ideas into one strong English prompt.

Rules:
- Reply with ONLY the final prompt, no explanations, no markdown, no quotes.
- Always write in English.
- Preserve the user's main subject and intent.
- Keep the prompt simple and powerful. Do not overload it with many objects.
- Use this structure: quality/style, main subject, one action/pose, one simple place, one lighting phrase.
- If the input is vague, add only the most useful missing details.
- Do not add random celebrities, brands, text, logos, watermarks, or extra people unless requested.
- Avoid moral commentary. This is prompt engineering, not chat.
- Keep it under 35 words.
- Style target: ${estilo}.

Image-only policy/configuration from politicas_imagem.txt:
${politicasImagem || "No image-only policy configured."}

Examples:
Input: "Gere uma imagem de um Uruguaiano"
Output: "professional realistic portrait, adult Uruguayan man, casual streetwear, Montevideo street, golden hour lighting, sharp focus, high detail"

Input: "um guerreiro medieval com espada"
Output: "cinematic realistic photo, medieval warrior holding a sword, worn armor, battlefield, dramatic cloudy lighting, sharp focus, high detail"

Input: "gato astronauta"
Output: "cute astronaut cat, floating in a spaceship, detailed space suit, soft cinematic lighting, sharp focus, high detail"
`.trim();

  try {
    const resposta = await pedirRespostaAoOllama([
      { role: "system", content: systemPrompt },
      { role: "user", content: ideia || ideiaOriginal }
    ], { usarPoliticasDono: false });

    const promptMelhorado = limparPromptImagem(resposta);
    if (promptMelhorado && promptMelhorado.length >= 20) {
      return promptMelhorado;
    }
  } catch (e) {
    console.log("Falha ao melhorar prompt, usando fallback:", e.message);
  }

  return promptFallbackImagem(ideia || ideiaOriginal, isAnime);
}

function deveResponder(message) {
  const conteudo = message.content.toLowerCase();
  const foiMencionado = message.mentions.has(client.user) || conteudo.includes("nana") || conteudo.includes("botbanana");
  const temPergunta = conteudo.includes("?");

  // Verifica se a mensagem tem vídeos (.mp4) ou imagens
  const temMidia = message.attachments.some(att =>
    att.contentType && (att.contentType.includes('image') || att.contentType.includes('video'))
  ) || conteudo.includes("http") || conteudo.includes(".mp4");

  if (foiMencionado) {
    return { responder: true, motivo: "mencao" };
  }

  if (temMidia) {
    return {
      responder: Math.random() < CHANCE_RESPONDER_MIDIA,
      motivo: "midia"
    };
  }

  if (temPergunta) {
    return {
      responder: Math.random() < CHANCE_RESPONDER_PERGUNTA,
      motivo: "pergunta"
    };
  }

  return {
    responder: Math.random() < CHANCE_RESPONDER_CASUAL,
    motivo: "casual"
  };
}

async function pedirRespostaAoOllama(messages, options = {}) {
  const { usarPoliticasDono = true, generationOptions = {} } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  const mensagensComPoliticas = usarPoliticasDono ? aplicarPoliticasDono(messages) : messages;

  const startTime = Date.now();
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: mensagensComPoliticas,
        options: {
          temperature: OLLAMA_TEMPERATURE,
          top_k: OLLAMA_TOP_K,
          top_p: OLLAMA_TOP_P,
          repeat_penalty: OLLAMA_REPEAT_PENALTY,
          num_predict: OLLAMA_NUM_PREDICT,
          ...generationOptions
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro no Ollama: ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;
    lastOllamaStats = {
      model: data.model || OLLAMA_MODEL,
      promptTokens: data.prompt_eval_count ?? null,
      outputTokens: data.eval_count ?? null,
      totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      totalDurationMs: data.total_duration ? Math.round(data.total_duration / 1_000_000) : latency,
      promptEvalDurationMs: data.prompt_eval_duration ? Math.round(data.prompt_eval_duration / 1_000_000) : null,
      evalDurationMs: data.eval_duration ? Math.round(data.eval_duration / 1_000_000) : null
    };
    console.log(`⏱️ [Texto/Ollama] Latência: ${latency}ms`);
    return data.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

async function extrairFofocas(channelId) {
  const cache = chatCache.get(channelId);
  if (!cache || cache.length < 10) return;

  const conversa = cache.map(msg => `${msg.author.username}: ${msg.content}`).join("\n");
  const prompt = [
    { role: "system", content: "Você é um espião. Analise as mensagens abaixo. Extraia em português APENAS fatos curtos, fofocas, segredos e características das pessoas. Retorne uma lista de bullet points com no máximo 3 itens cruciais. REGRA CRÍTICA: Se não houver fofoca real ou for apenas papo furado, retorne EXATAMENTE a palavra NADA e nada mais." },
    { role: "user", content: conversa }
  ];

  try {
    const resposta = await pedirRespostaAoOllama(prompt);

    const invalida = resposta.toUpperCase().includes("NADA") ||
      resposta.toLowerCase().includes("não há") ||
      resposta.toLowerCase().includes("não contém");

    if (resposta && resposta.length > 5 && !invalida) {
      let fofocas = [];
      try { fofocas = JSON.parse(fs.readFileSync(FOFOCAS_PATH, "utf-8")); } catch (e) { }

      fofocas.push(`[${new Date().toLocaleDateString()}] ${resposta.replace(/\n/g, " ")}`);
      while (fofocas.length > FOFOCA_MAX_ITEMS) fofocas.shift();

      fs.writeFileSync(FOFOCAS_PATH, JSON.stringify(fofocas, null, 2));
      console.log("🕵️ Nova fofoca gravada no banco de dados!");
    }
  } catch (err) {
    console.log("Falha na fofoca secreta: ", err.message);
  }
}

async function montarContexto(message, motivo) {
  let fofocaContexto = "";
  if (message.guild && message.guild.id === process.env.SERVIDOR_FOFOCA) {
    try {
      const fofocas = JSON.parse(fs.readFileSync(FOFOCAS_PATH, "utf-8"));
      if (fofocas.length > 0) {
        fofocaContexto = "\n\nMEMÓRIA LONGA (Fofocas que você sabe sobre as pessoas deste servidor):\n" + fofocas.join("\n");
      }
    } catch (e) { }
  }

  const historico = chatCache.get(message.channel.id) || [];
  const formatHistorico = historico
    .slice(-CONTEXT_HISTORY_LIMIT)
    .filter((msg) => !msg.author.bot || msg.author.id === client.user.id)
    .map((msg) => ({
      role: msg.author.id === client.user.id ? "assistant" : "user",
      content: msg.author.id === client.user.id ? msg.content : `@${msg.author.username}: ${msg.content}`
    }));

  return [
    {
      role: "system",
      content: `
Use a configuração principal do dono do bot que foi enviada antes deste contexto.${fofocaContexto}

[SITUAÇÃO ATUAL]
- Motivo da sua fala agora: ${motivo}.
- O usuário principal é: @${message.author.username}.
- REGRA CRÍTICA 1: Responda diretamente ao @${message.author.username}.
- REGRA CRÍTICA 2: NUNCA diga seu próprio nome no início da frase.
`
    },
    ...formatHistorico
  ];
}

async function responderComOllama(message, motivo) {
  await message.channel.sendTyping();
  const contexto = await montarContexto(message, motivo);
  const respostaBruta = await pedirRespostaAoOllama(contexto);
  let resposta = limparResposta(respostaBruta);

  // Filtro Anti-Alucinação: Remove qualquer prefixo de chat ou roteiro que a IA possa gerar sem querer
  // Ex: "Nana:", "Joao:", "Nana, ", "BotBanana disse:"
  resposta = resposta.replace(/^(?:Nana|BotBanana|[^:]+)\s*[:]\s*/i, '');
  resposta = resposta.replace(/^Nana,\s*/i, '');
  resposta = resposta.replace(new RegExp(`^${message.author.username}[,:]?\\s*`, 'i'), '');

  // Remove aspas que a IA as vezes coloca no início e fim da frase
  resposta = resposta.replace(/^["']|["']$/g, '').trim();

  let enviarGif = false;
  let gifUrl = null;
  if (resposta.includes("[GIF]")) {
    resposta = resposta.replace(/\[GIF\]/g, "").trim();
    // Limite: 1 GIF a cada 3 minutos (180.000 ms) para não virar spam
    if (Date.now() - ultimoGifEnviado > GIF_COOLDOWN_MS) {
      enviarGif = true;
    }
  }

  // Ordem direta: Se o usuário pedir um gif na cara dura, ignora limite e manda!
  if (message.content.toLowerCase().match(/mand[ae].*gif/)) {
    enviarGif = true;
  }

  if (!resposta) return;

  if (enviarGif) {
    try {
      const savedGifs = JSON.parse(fs.readFileSync(GIFS_PATH, "utf-8"));
      if (savedGifs.length > 0) {
        gifUrl = savedGifs[Math.floor(Math.random() * savedGifs.length)];
        ultimoGifEnviado = Date.now();
      } else {
        gifUrl = DEFAULT_GIF_URL;
      }
    } catch (e) {
      gifUrl = DEFAULT_GIF_URL;
    }

    // Se ela escolheu mandar o GIF, apagamos o texto para ir SÓ o GIF!
    if (gifUrl) {
      resposta = "";
    }
  }

  // Se não sobrou resposta nenhuma e também não tem GIF, não manda nada.
  if (!resposta && !gifUrl) return;

  // Monta a mensagem final (se tiver só GIF, vai só o link do GIF)
  const conteudoFinal = (resposta ? resposta.slice(0, 1800) : "") + (gifUrl ? (resposta ? `\n${gifUrl}` : gifUrl) : "");

  await message.reply({
    content: conteudoFinal,
    allowedMentions: {
      repliedUser: true
    }
  });
}

client.once("clientReady", () => {
  console.log(`✅ Bot logado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // --- Coleta Automática de GIFs do Servidor ---
  const gifRegex = /https?:\/\/(?:tenor\.com|giphy\.com)\S+/gi;
  const gifLinks = message.content.match(gifRegex) || [];
  message.attachments.forEach(att => {
    if (att.contentType && att.contentType.includes('gif')) {
      gifLinks.push(att.url);
    }
  });

  if (gifLinks.length > 0) {
    let savedGifs = [];
    try { savedGifs = JSON.parse(fs.readFileSync(GIFS_PATH, "utf-8")); } catch (e) { }

    let novosGifs = false;
    gifLinks.forEach(link => {
      if (!savedGifs.includes(link)) {
        savedGifs.push(link);
        novosGifs = true;
      }
    });

    if (novosGifs) {
      fs.writeFileSync(GIFS_PATH, JSON.stringify(savedGifs, null, 2));
    }
  }
  // ---------------------------------------------

  // Salvar mensagem no Cache Rápido interno (privacidade garantida, tudo só na sua RAM)
  if (!chatCache.has(message.channel.id)) {
    chatCache.set(message.channel.id, []);
  }
  const channelCache = chatCache.get(message.channel.id);
  channelCache.push(message);
  if (channelCache.length > CHAT_CACHE_LIMIT) {
    channelCache.shift();
  }

  // --- Espionagem (Fofoca) ---
  if (process.env.SERVIDOR_FOFOCA && message.guild.id === process.env.SERVIDOR_FOFOCA) {
    mensagemCountFofoca++;
    if (mensagemCountFofoca >= FOFOCA_MIN_MESSAGES) {
      mensagemCountFofoca = 0;
      extrairFofocas(message.channel.id); // Roda em background invisível
    }
  }
  // ---------------------------

  // Ajuda: lista comandos sem depender da LLM.
  if (isCommand(message, ["!help", "!ajuda", "!comandos"])) {
    return message.reply({
      content: [
        "**Comandos da Nana**",
        "`!help` / `!ajuda` / `!comandos` - mostra esta lista.",
        "`!ia <texto>` / `!llm <texto>` / `!texto <texto>` - conversa com a IA no modo casual/persona.",
        "`!question <pergunta>` / `!pergunta <pergunta>` / `!q <pergunta>` - pergunta séria, resposta profissional.",
        `  Provedor atual do !question: \`${QUESTION_PROVIDER === "gemini_cli" ? "Gemini CLI com fallback local" : "Ollama local"}\`.`,
        "`!imagem <prompt>` / `!img <prompt>` / `!image <prompt>` - gera imagem realista pelo Forge.",
        "`!anime <prompt>` - gera imagem em estilo anime pelo Forge.",
        "`!voz <texto>` / `!f <texto>` / `!voice <texto>` - fala no canal de voz onde você está.",
        "",
        "Também respondo quando me mencionam ou falam `nana` / `botbanana`."
      ].join("\n"),
      allowedMentions: { repliedUser: false, parse: [] }
    });
  }

  // Voz: separado dos comandos de texto/imagem.
  if (isCommand(message, ["!f", "!voz", "!voice"])) {
    const texto = getCommandText(message, ["!f", "!voz", "!voice"]);
    if (!texto) {
      // Deleta a mensagem de comando vazia antes de responder
      await message.delete();
      return message.channel.send("Digite algo para eu falar: `!voz Olá mundo`").then(msg => {
        // Apaga a mensagem de erro do bot depois de 5 segundos
        setTimeout(() => msg.delete(), TEMP_ERROR_DELETE_MS);
      });
    }

    if (!message.member.voice.channel) {
      return message.reply("❌ Você precisa estar em um canal de voz!");
    }

    markVoiceInUse(message);

    let tempDir = null;
    try {
      tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bottts-voice-"));
      const filePath = path.join(tempDir, "voz.mp3");
      await message.delete().catch(() => null);
      const provider = await generateSpeech(texto, filePath);

      console.log(`▶️  Reproduzindo áudio no canal de voz (${provider})...`);

      const session = getVoiceSession(message);
      const resource = createAudioResource(filePath);
      session.player.play(resource);
      session.player.once(AudioPlayerStatus.Idle, async () => {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => null);
        scheduleVoiceLeave(message.guild.id);
      });

    } catch (err) {
      console.error("🔥 Erro ao gerar ou reproduzir a fala:", err);
      if (tempDir) {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => null);
      }
      // Envia uma mensagem de erro no canal que também se apaga
      message.channel.send(`⚠️ Erro só na voz: ${err.message}`).then(msg => {
        setTimeout(() => msg.delete(), TEMP_ERROR_DELETE_MS);
      });
    }

    return;
  }

  // Texto: força uma resposta da LLM sem depender de menção/cooldown.
  if (isCommand(message, ["!ia", "!llm", "!texto"])) {
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

  // Pergunta séria: modo suporte profissional, separado da persona de resenha.
  if (isCommand(message, ["!question", "!pergunta", "!q"])) {
    const texto = getCommandText(message, ["!question", "!pergunta", "!q"]);
    if (!texto) {
      return message.reply("Digite a pergunta: `!question quais são os mapas de Path of Exile?`");
    }

    if (QUESTION_PROVIDER !== "gemini_cli" && isPerguntaMapasPathOfExile(texto)) {
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

  // Imagem: separado dos comandos de texto/voz.
  if (isCommand(message, ["!image", "!imagem", "!img", "!anime"])) {
    const isAnime = isCommand(message, ["!anime"]);
    const cmd = isAnime ? "!anime" : "!imagem";
    const prompt = getCommandText(message, ["!image", "!imagem", "!img", "!anime"]);
    if (!prompt) {
      return message.reply(`Digite o que você quer desenhar: \`${cmd} um gato cibernético\``);
    }

    const m = await message.channel.send("🎨 Melhorando o prompt da imagem. Aguarde...");

    const promptEmIngles = await melhorarPromptImagem(prompt, isAnime);
    console.log(`🖼️ Prompt melhorado: ${promptEmIngles}`);

    // Configuração Dinâmica do Modelo:
    const modelo = isAnime ? FORGE_ANIME_MODEL : FORGE_REALISTIC_MODEL;
    const negative_prompt = isAnime
      ? FORGE_ANIME_NEGATIVE_PROMPT
      : FORGE_REALISTIC_NEGATIVE_PROMPT;

    const payload = {
      prompt: promptEmIngles,
      negative_prompt: negative_prompt,
      steps: FORGE_STEPS,
      width: FORGE_WIDTH,
      height: FORGE_HEIGHT,
      override_settings: {
        sd_model_checkpoint: modelo
      },
      sampler_name: FORGE_SAMPLER,
      batch_size: FORGE_BATCH_SIZE
    };

    const startTime = Date.now();
    try {
      await assertForgeReady();
      const response = await fetch(`${FORGE_HOST}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return m.edit(`⚠️ Erro da IA (Status ${response.status}). O Forge WebUI está rodando no WSL?`);
      }

      const data = await response.json();
      const imageBase64 = data.images[0];
      const buffer = Buffer.from(imageBase64, "base64");
      const attachment = new AttachmentBuilder(buffer, { name: "imagem.png" });
      const latency = Date.now() - startTime;
      console.log(`⏱️ [Imagem/Forge] Latência: ${latency}ms para o prompt "${prompt}"`);

      await message.reply({ content: `✨ Imagem gerada em ${latency / 1000}s: \`${prompt}\``, files: [attachment] });
      await m.delete().catch(() => null);
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      m.edit(`❌ Erro só na imagem: ${err.message}. Abra o Forge com \`stable-diffusion-webui-forge\\webui-user.bat\`.`);
    }
    return;
  }

  const conteudo = message.content.trim();
  if (!conteudo) return;
  if (conteudo.startsWith("!")) return;

  const decisao = deveResponder(message);
  if (!decisao.responder) return;
  // Se marcou o bot direto, ignora o cooldown longo pra não deixar o usuário no vácuo
  if (decisao.motivo !== "mencao" && !passouCooldown(message)) return;

  console.log(`💬 Respondendo ao usuário @${message.author.username} no canal #${message.channel.name} (Motivo: ${decisao.motivo})...`);

  try {
    await responderComOllama(message, decisao.motivo);
    console.log(`✅ Resposta enviada para @${message.author.username} com sucesso.`);
  } catch (err) {
    console.error("🔥 Erro ao responder com Ollama:", err);

    if (message.mentions.has(client.user)) {
      await message.reply({
        content: "Deu erro aqui. Vê se o Ollama está aberto.",
        allowedMentions: {
          repliedUser: false,
          parse: []
        }
      }).catch(() => null);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

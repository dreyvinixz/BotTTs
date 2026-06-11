require("dotenv").config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");

// --- NOVAS IMPORTAÇÕES DO GOOGLE CLOUD ---
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");
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
let skipGoogleTts = false;

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:1.7b";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

// Memória RAM ultra-rápida (totalmente interna/privada, não envia para o Discord nem para a nuvem)
const chatCache = new Map();
let ultimoGifEnviado = 0; // Limite de spam de GIFs
let mensagemCountFofoca = 0; // Contador para a Fofoqueira
const CHANCE_RESPONDER_PERGUNTA = 0.75;
const CHANCE_RESPONDER_CASUAL = 0.02; // Caiu de 12% para 2% para ficar mais quieta
const CHANCE_RESPONDER_MIDIA = 0.60;  // 60% de chance de reagir a imagens/videos
const COOLDOWN_USUARIO_MS = 25_000;
const COOLDOWN_CANAL_MS = 8_000;
const OLLAMA_TIMEOUT_MS = 30_000;

const userCooldown = new Map();
const channelCooldown = new Map();

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
    voice: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-A' },
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
    await tts.setMetadata("pt-BR-AntonioNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
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

async function pedirRespostaAoOllama(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  const startTime = Date.now();
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages,
        options: {
          temperature: 0.6,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.15,
          num_predict: 120
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro no Ollama: ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;
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
      const fofocasPath = path.join(__dirname, "fofocas.json");
      try { fofocas = JSON.parse(fs.readFileSync(fofocasPath, "utf-8")); } catch (e) { }

      fofocas.push(`[${new Date().toLocaleDateString()}] ${resposta.replace(/\n/g, " ")}`);
      if (fofocas.length > 30) fofocas.shift(); // Manter até 30 fatos longos

      fs.writeFileSync(fofocasPath, JSON.stringify(fofocas, null, 2));
      console.log("🕵️ Nova fofoca gravada no banco de dados!");
    }
  } catch (err) {
    console.log("Falha na fofoca secreta: ", err.message);
  }
}

async function montarContexto(message, motivo) {
  let personalidade = "Você é um bot casual.";
  let politicas = "Seja respeitoso.";
  try {
    personalidade = fs.readFileSync(path.join(__dirname, "personalidade.txt"), "utf-8");
    politicas = fs.readFileSync(path.join(__dirname, "politicas.txt"), "utf-8");
  } catch (e) { }

  let fofocaContexto = "";
  if (message.guild && message.guild.id === process.env.SERVIDOR_FOFOCA) {
    try {
      const fofocas = JSON.parse(fs.readFileSync(path.join(__dirname, "fofocas.json"), "utf-8"));
      if (fofocas.length > 0) {
        fofocaContexto = "\n\nMEMÓRIA LONGA (Fofocas que você sabe sobre as pessoas deste servidor):\n" + fofocas.join("\n");
      }
    } catch (e) { }

    // Injetar a personalidade clonada do banana.cdr neste servidor específico
    try {
      const perBanana = fs.readFileSync(path.join(__dirname, "personalidade_banana.txt"), "utf-8");
      fofocaContexto += "\n\nESTILO DE PERSONALIDADE CLONADO (AJA EXATAMENTE ASSIM):\n" + perBanana;
    } catch (e) { }
  }

  const historico = chatCache.get(message.channel.id) || [];
  const formatHistorico = historico
    .slice(-6) // REDUZIDO DE 15 PARA 6 PARA A IA NÃO ESQUECER AS REGRAS E A PERSONALIDADE
    .filter((msg) => !msg.author.bot || msg.author.id === client.user.id)
    .map((msg) => ({
      role: msg.author.id === client.user.id ? "assistant" : "user",
      content: msg.author.id === client.user.id ? msg.content : `@${msg.author.username}: ${msg.content}`
    }));

  return [
    {
      role: "system",
      content: `
Você PRECISA seguir esta personalidade e regras ESTRITAMENTE:

[PERSONALIDADE]
${personalidade}

[POLÍTICAS]
${politicas}${fofocaContexto}

[SITUAÇÃO ATUAL]
- Motivo da sua fala agora: ${motivo}.
- O usuário principal é: @${message.author.username}.
- REGRA CRÍTICA 1: Responda diretamente ao @${message.author.username} com a sua personalidade!
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
    if (Date.now() - ultimoGifEnviado > 180000) {
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
      const savedGifs = JSON.parse(fs.readFileSync(path.join(__dirname, "gifs.json"), "utf-8"));
      if (savedGifs.length > 0) {
        gifUrl = savedGifs[Math.floor(Math.random() * savedGifs.length)];
        ultimoGifEnviado = Date.now();
      } else {
        gifUrl = "https://media.tenor.com/Z4cOQWc-DscAAAAC/banana.gif"; // GIF padrão
      }
    } catch (e) {
      gifUrl = "https://media.tenor.com/Z4cOQWc-DscAAAAC/banana.gif"; // GIF padrão
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
    const gifsPath = path.join(__dirname, "gifs.json");
    try { savedGifs = JSON.parse(fs.readFileSync(gifsPath, "utf-8")); } catch (e) { }

    let novosGifs = false;
    gifLinks.forEach(link => {
      if (!savedGifs.includes(link)) {
        savedGifs.push(link);
        novosGifs = true;
      }
    });

    if (novosGifs) {
      fs.writeFileSync(gifsPath, JSON.stringify(savedGifs, null, 2));
    }
  }
  // ---------------------------------------------

  // Salvar mensagem no Cache Rápido interno (privacidade garantida, tudo só na sua RAM)
  if (!chatCache.has(message.channel.id)) {
    chatCache.set(message.channel.id, []);
  }
  const channelCache = chatCache.get(message.channel.id);
  channelCache.push(message);
  // Limitar a 100 mensagens para não estourar o "Cérebro" da IA (Limite de Tokens)
  if (channelCache.length > 100) {
    channelCache.shift();
  }

  // --- Espionagem (Fofoca) ---
  if (process.env.SERVIDOR_FOFOCA && message.guild.id === process.env.SERVIDOR_FOFOCA) {
    mensagemCountFofoca++;
    // Se acumulou 50 mensagens desde a última espionagem
    if (mensagemCountFofoca >= 50) {
      mensagemCountFofoca = 0;
      extrairFofocas(message.channel.id); // Roda em background invisível
    }
  }
  // ---------------------------

  // O comando agora é "!f"
  if (message.content.startsWith("!f")) {
    const texto = message.content.replace("!f", "").trim();
    if (!texto) {
      // Deleta a mensagem de comando vazia antes de responder
      await message.delete();
      return message.channel.send("Digite algo para eu falar: `!f Olá mundo`").then(msg => {
        // Apaga a mensagem de erro do bot depois de 5 segundos
        setTimeout(() => msg.delete(), 5000);
      });
    }

    if (!message.member.voice.channel) {
      return message.reply("❌ Você precisa estar em um canal de voz!");
    }

    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    try {
      const filePath = "voz.mp3";
      await message.delete().catch(() => null);
      const provider = await generateSpeech(texto, filePath);

      console.log(`▶️  Reproduzindo áudio no canal de voz (${provider})...`);

      const player = createAudioPlayer();
      const resource = createAudioResource(filePath);
      player.play(resource);
      connection.subscribe(player);

    } catch (err) {
      console.error("🔥 Erro ao gerar ou reproduzir a fala:", err);
      // Envia uma mensagem de erro no canal que também se apaga
      message.channel.send("⚠️ Erro ao gerar a fala.").then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }

    return;
  }

  // Novo comando para geração de imagens (!image e !anime)
  if (message.content.startsWith("!image") || message.content.startsWith("!anime")) {
    const isAnime = message.content.startsWith("!anime");
    const cmd = isAnime ? "!anime" : "!image";
    const prompt = message.content.replace(cmd, "").trim();
    if (!prompt) {
      return message.reply(`Digite o que você quer desenhar: \`${cmd} um gato cibernético\``);
    }

    const m = await message.channel.send(`🎨 Traduzindo e melhorando a ideia: \`${prompt}\`. Aguarde...`);

    // Melhora e traduz o prompt usando o próprio Ollama
    let promptEmIngles = prompt;
    try {
      let estiloPrompt = isAnime
        ? "You are an expert anime prompt engineer. Translate the user's idea to English and add high quality anime modifiers like 'masterpiece, best quality, highly detailed anime art, 4k, studio ghibli style, vibrant colors'. Reply ONLY with the final English prompt."
        : "You are an expert realistic photography prompt engineer. Translate the user's idea to English and add high quality modifiers like 'masterpiece, best quality, highly detailed, 4k, cinematic lighting, photorealistic, 8k resolution, raw photo'. Reply ONLY with the final English prompt.";

      promptEmIngles = await pedirRespostaAoOllama([
        { role: "system", content: estiloPrompt },
        { role: "user", content: prompt }
      ]);
      // Limpar aspas caso ele responda com aspas
      promptEmIngles = promptEmIngles.replace(/^"|"$/g, '').trim();
    } catch (e) {
      console.log("Falha ao melhorar prompt, usando original", e);
    }

    // Configuração Dinâmica do Modelo:
    const modelo = isAnime ? "MeinaMix_V11.safetensors" : "DreamShaper_8_pruned.safetensors";
    const negative_prompt = isAnime
      ? "ugly, bad anatomy, deformed, poorly drawn face, poorly drawn hands, missing fingers, missing limbs, watermark, text, blurry"
      : "ugly, low quality, bad anatomy, deformed, watermark, extra fingers, mutated hands, poorly drawn, blurry, artifacts";

    const payload = {
      prompt: promptEmIngles,
      negative_prompt: negative_prompt,
      steps: 25,
      width: 512,
      height: 512,
      override_settings: {
        sd_model_checkpoint: modelo
      },
      sampler_name: "Euler a",
      batch_size: 1
    };

    const startTime = Date.now();
    try {
      const response = await fetch("http://127.0.0.1:7860/sdapi/v1/txt2img", {
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
      m.edit(`❌ Erro inesperado ao gerar imagem: ${err.message}`);
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

const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");
const { execFile } = require("child_process");
const config = require("../core/config");
const { assertOllamaReady } = require("../core/services");
const { limparResposta, pedirRespostaAoOllama, logOllamaTokenStats } = require("./ollama");

const execFileAsync = util.promisify(execFile);

function isPerguntaMapasPathOfExile(texto) {
  const lower = texto.toLowerCase();
  return /path\s*of\s*exile|\bpoe\b/.test(lower)
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

async function perguntarGeminiCli(texto) {
  const startTime = Date.now();
  console.log(`❓ [Question/Gemini CLI] Iniciando. Modelo: ${config.GEMINI_CLI_MODEL || "auto"}. Pergunta: "${texto.slice(0, 140)}"`);

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bottts-gemini-"));
  const promptPath = path.join(tempDir, "prompt.txt");
  await fs.promises.writeFile(promptPath, montarPromptQuestion(texto), "utf-8");

  const modelArgs = config.GEMINI_CLI_MODEL && config.GEMINI_CLI_MODEL !== "auto"
    ? ` --model ${JSON.stringify(config.GEMINI_CLI_MODEL)}`
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
      timeout: config.GEMINI_CLI_TIMEOUT_MS,
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
      num_predict: 500
    }
  }));
  const latency = Date.now() - startTime;
  console.log(`✅ [Question/Ollama Local] Resposta recebida em ${latency}ms (${resposta.length} chars).`);
  logOllamaTokenStats();
  return resposta;
}

async function perguntarQuestion(texto) {
  console.log(`❓ [Question] Provider configurado: ${config.QUESTION_PROVIDER}`);
  if (config.QUESTION_PROVIDER === "gemini_cli") {
    try {
      return limparResposta(await perguntarGeminiCli(texto));
    } catch (err) {
      console.warn(`⚠️ [Question/Gemini CLI] Falhou; usando Ollama local. Erro: ${err.message}`);
    }
  }

  return perguntarQuestionLocal(texto);
}

module.exports = {
  isPerguntaMapasPathOfExile,
  respostaMapasPathOfExile,
  perguntarQuestion
};

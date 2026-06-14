const fs = require("fs");
const path = require("path");
const config = require("./config");

let lastOllamaStats = null;

function lerPoliticasDono() {
  try {
    return fs.readFileSync(config.POLITICAS_PATH, "utf-8").trim();
  } catch (e) {
    console.warn(`⚠️ ${path.basename(config.POLITICAS_PATH)} não encontrado ou não pôde ser lido.`);
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

function limparResposta(texto) {
  return (texto || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/@everyone/g, "everyone")
    .replace(/@here/g, "here")
    .trim();
}

async function pedirRespostaAoOllama(messages, options = {}) {
  const { usarPoliticasDono = true, generationOptions = {} } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.OLLAMA_TIMEOUT_MS);
  const mensagensComPoliticas = usarPoliticasDono ? aplicarPoliticasDono(messages) : messages;

  const startTime = Date.now();
  try {
    const response = await fetch(`${config.OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.OLLAMA_MODEL,
        stream: false,
        messages: mensagensComPoliticas,
        options: {
          temperature: config.OLLAMA_TEMPERATURE,
          top_k: config.OLLAMA_TOP_K,
          top_p: config.OLLAMA_TOP_P,
          repeat_penalty: config.OLLAMA_REPEAT_PENALTY,
          num_predict: config.OLLAMA_NUM_PREDICT,
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
      model: data.model || config.OLLAMA_MODEL,
      promptTokens: data.prompt_eval_count ?? null,
      outputTokens: data.eval_count ?? null,
      totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      totalDurationMs: data.total_duration ? Math.round(data.total_duration / 1_000_000) : latency
    };

    console.log(`⏱️ [Texto/Ollama] Latência: ${latency}ms`);
    return data.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
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

module.exports = {
  limparResposta,
  pedirRespostaAoOllama,
  logOllamaTokenStats
};

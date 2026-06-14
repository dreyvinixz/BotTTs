const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(ROOT_DIR, ".env") });

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

const DATA_DIR = path.resolve(ROOT_DIR, getEnvString("DATA_DIR", "data"));
ensureDir(DATA_DIR);

const GIFS_PATH = path.resolve(ROOT_DIR, getEnvString("GIFS_PATH", path.join("data", "gifs.json")));
const FOFOCAS_PATH = path.resolve(ROOT_DIR, getEnvString("FOFOCAS_PATH", path.join("data", "fofocas.json")));
const ECONOMIA_PATH = path.resolve(ROOT_DIR, getEnvString("ECONOMIA_PATH", path.join("data", "economia.json")));
ensureDir(path.dirname(GIFS_PATH));
ensureDir(path.dirname(FOFOCAS_PATH));
ensureDir(path.dirname(ECONOMIA_PATH));

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  GIFS_PATH,
  FOFOCAS_PATH,
  ECONOMIA_PATH,
  DEFAULT_GIF_URL: getEnvString("DEFAULT_GIF_URL", "https://media.tenor.com/Z4cOQWc-DscAAAAC/banana.gif"),
  POLITICAS_PATH: path.resolve(ROOT_DIR, getEnvString("POLITICAS_PATH", "politicas.txt")),
  POLITICAS_IMAGEM_PATH: path.resolve(ROOT_DIR, getEnvString("POLITICAS_IMAGEM_PATH", "politicas_imagem.txt")),

  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  SERVIDOR_FOFOCA: process.env.SERVIDOR_FOFOCA,

  OLLAMA_MODEL: getEnvString("OLLAMA_MODEL", "qwen3:1.7b"),
  OLLAMA_HOST: getEnvString("OLLAMA_HOST", "http://127.0.0.1:11434"),
  OLLAMA_TIMEOUT_MS: getEnvNumber("OLLAMA_TIMEOUT_MS", 30_000),
  OLLAMA_NUM_PREDICT: getEnvNumber("OLLAMA_NUM_PREDICT", 120),
  OLLAMA_TEMPERATURE: getEnvNumber("OLLAMA_TEMPERATURE", 0.6),
  OLLAMA_TOP_K: getEnvNumber("OLLAMA_TOP_K", 40),
  OLLAMA_TOP_P: getEnvNumber("OLLAMA_TOP_P", 0.9),
  OLLAMA_REPEAT_PENALTY: getEnvNumber("OLLAMA_REPEAT_PENALTY", 1.15),

  QUESTION_PROVIDER: getEnvString("QUESTION_PROVIDER", "local").toLowerCase(),
  GEMINI_CLI_MODEL: getEnvString("GEMINI_CLI_MODEL", "auto").toLowerCase(),
  GEMINI_CLI_TIMEOUT_MS: getEnvNumber("GEMINI_CLI_TIMEOUT_MS", 120_000),

  FORGE_HOST: getEnvString("FORGE_HOST", "http://127.0.0.1:7860"),
  FORGE_REALISTIC_MODEL: getEnvString("FORGE_REALISTIC_MODEL", "DreamShaper_8_pruned.safetensors"),
  FORGE_ANIME_MODEL: getEnvString("FORGE_ANIME_MODEL", "MeinaMix_V11.safetensors"),
  FORGE_STEPS: getEnvNumber("FORGE_STEPS", 25),
  FORGE_WIDTH: getEnvNumber("FORGE_WIDTH", 512),
  FORGE_HEIGHT: getEnvNumber("FORGE_HEIGHT", 512),
  FORGE_SAMPLER: getEnvString("FORGE_SAMPLER", "Euler a"),
  FORGE_BATCH_SIZE: getEnvNumber("FORGE_BATCH_SIZE", 1),
  FORGE_REALISTIC_NEGATIVE_PROMPT: getEnvString("FORGE_REALISTIC_NEGATIVE_PROMPT", "ugly, low quality, bad anatomy, deformed, watermark, text, extra fingers, mutated hands, poorly drawn, blurry, artifacts, cluttered background, messy composition"),
  FORGE_ANIME_NEGATIVE_PROMPT: getEnvString("FORGE_ANIME_NEGATIVE_PROMPT", "ugly, low quality, bad anatomy, deformed, poorly drawn face, poorly drawn hands, missing fingers, missing limbs, cluttered background, messy composition, watermark, text, blurry"),

  EDGE_TTS_VOICE: getEnvString("EDGE_TTS_VOICE", "pt-BR-AntonioNeural"),
  GOOGLE_TTS_LANGUAGE_CODE: getEnvString("GOOGLE_TTS_LANGUAGE_CODE", "pt-BR"),
  GOOGLE_TTS_VOICE: getEnvString("GOOGLE_TTS_VOICE", "pt-BR-Wavenet-A"),
  VOICE_IDLE_TIMEOUT_MS: getEnvNumber("VOICE_IDLE_TIMEOUT_MS", 300_000),

  CHANCE_RESPONDER_PERGUNTA: getEnvNumber("CHANCE_RESPONDER_PERGUNTA", 0.12),
  CHANCE_RESPONDER_CASUAL: getEnvNumber("CHANCE_RESPONDER_CASUAL", 0.003),
  CHANCE_RESPONDER_MIDIA: getEnvNumber("CHANCE_RESPONDER_MIDIA", 0.10),
  COOLDOWN_USUARIO_MS: getEnvNumber("COOLDOWN_USUARIO_MS", 120_000),
  COOLDOWN_CANAL_MS: getEnvNumber("COOLDOWN_CANAL_MS", 60_000),
  CHAT_CACHE_LIMIT: getEnvNumber("CHAT_CACHE_LIMIT", 100),
  CONTEXT_HISTORY_LIMIT: getEnvNumber("CONTEXT_HISTORY_LIMIT", 6),
  FOFOCA_MIN_MESSAGES: getEnvNumber("FOFOCA_MIN_MESSAGES", 50),
  FOFOCA_MAX_ITEMS: getEnvNumber("FOFOCA_MAX_ITEMS", 30),
  GIF_COOLDOWN_MS: getEnvNumber("GIF_COOLDOWN_MS", 180_000),
  TEMP_ERROR_DELETE_MS: getEnvNumber("TEMP_ERROR_DELETE_MS", 5_000)
};

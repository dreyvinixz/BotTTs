const config = require("../core/config");
const { choice } = require("../core/random");

const triviaData = config.static.games.trivia;
const BANCO_PERGUNTAS = triviaData.questions || {};
const perguntasUsadas = new Map();

function getPerguntas(temaKey, diffKey) {
  return BANCO_PERGUNTAS[temaKey]?.[diffKey] || [];
}

function getPerguntaAleatoria(channelId, temaKey, diffKey, rng = Math.random) {
  const perguntas = getPerguntas(temaKey, diffKey);
  if (perguntas.length === 0) return null;

  const historyLimit = triviaData.historyLimit || 30;
  const resetKeepLast = triviaData.resetKeepLast || 3;
  const key = `${channelId}:${temaKey}:${diffKey}`;
  if (!perguntasUsadas.has(key)) perguntasUsadas.set(key, []);

  const historico = perguntasUsadas.get(key);
  let disponiveis = perguntas.map((_, i) => i).filter((i) => !historico.includes(i));

  if (disponiveis.length === 0) {
    const recentes = historico.slice(-resetKeepLast);
    perguntasUsadas.set(key, recentes);
    disponiveis = perguntas.map((_, i) => i).filter((i) => !recentes.includes(i));
  }

  const idx = choice(disponiveis, rng);
  perguntasUsadas.get(key).push(idx);
  while (perguntasUsadas.get(key).length > historyLimit) perguntasUsadas.get(key).shift();

  return perguntas[idx];
}

function resetPerguntasUsadas() {
  perguntasUsadas.clear();
}

module.exports = {
  BANCO_PERGUNTAS,
  getPerguntaAleatoria,
  resetPerguntasUsadas
};

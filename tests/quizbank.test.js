const test = require("node:test");
const assert = require("node:assert/strict");
const { getPerguntaAleatoria, resetPerguntasUsadas } = require("../scripts/games/quizbank");
const { getCenarioAleatorio, resetCenariosUsados } = require("../scripts/games/improvisobank");

test("trivia question loader returns configured questions and null for misses", () => {
  resetPerguntasUsadas();
  const q = getPerguntaAleatoria("chan", "geral", "facil", () => 0);
  assert.ok(q.p);
  assert.equal(getPerguntaAleatoria("chan", "tema-inexistente", "facil"), null);
});

test("improviso scenario replaces the player placeholder", () => {
  resetCenariosUsados();
  const scenario = getCenarioAleatorio("chan", "Maria", () => 0);
  assert.match(scenario.cenario, /Maria/);
  assert.ok(scenario.img);
});

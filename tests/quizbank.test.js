const test = require("node:test");
const assert = require("node:assert/strict");
const quizbank = require("../scripts/games/quizbank");
const { getPerguntaAleatoria, resetPerguntasUsadas } = quizbank;
const { getCenarioAleatorio, resetCenariosUsados } = require("../scripts/games/improvisobank");

quizbank.__disableSavingForTests(true);

test("trivia question loader returns configured questions and null for misses", () => {
  resetPerguntasUsadas();
  const q = getPerguntaAleatoria("chan", "geral", "facil", () => 0);
  assert.ok(q.p);
  assert.equal(getPerguntaAleatoria("chan", "tema-inexistente", "facil"), null);
});

test("trivia question history tracks channel theme difficulty selections", () => {
  resetPerguntasUsadas();
  getPerguntaAleatoria("chan", "geral", "facil", () => 0);
  const history = quizbank.__getHistoryForTests();

  assert.deepEqual(history["chan:geral:facil"], [0]);

  quizbank.__setHistoryForTests({ "chan:geral:facil": [0, 1] });
  assert.deepEqual(quizbank.__getHistoryForTests()["chan:geral:facil"], [0, 1]);
});

test("improviso scenario replaces the player placeholder", () => {
  resetCenariosUsados();
  const scenario = getCenarioAleatorio("chan", "Maria", () => 0);
  assert.match(scenario.cenario, /Maria/);
  assert.ok(scenario.img);
});

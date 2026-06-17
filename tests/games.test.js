const test = require("node:test");
const assert = require("node:assert/strict");
const { maskWord, getPalavraAleatoria } = require("../scripts/games/forca");

test("forca masks unguessed letters", () => {
  assert.equal(maskWord("BANANA", new Set(["A", "N"])), "_ A N A N A");
});

test("forca picks configured words", () => {
  const word = getPalavraAleatoria("test-channel", "animais");
  assert.equal(typeof word, "string");
  assert.ok(word.length > 0);
});

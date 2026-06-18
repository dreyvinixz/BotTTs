const test = require("node:test");
const assert = require("node:assert/strict");
const { maskWord, getPalavraAleatoria } = require("../scripts/games/forca");
const { handleGamesCommand } = require("../scripts/games/menu");

test("forca masks unguessed letters", () => {
  assert.equal(maskWord("BANANA", new Set(["A", "N"])), "_ A N A N A");
});

test("forca picks configured words", () => {
  const word = getPalavraAleatoria("test-channel", "animais");
  assert.equal(typeof word, "string");
  assert.ok(word.length > 0);
});

test("games menu no longer exposes lootbox button", async () => {
  let payload;
  await handleGamesCommand({
    author: { id: "player" },
    reply: async (nextPayload) => {
      payload = nextPayload;
    }
  });

  const buttonIds = payload.components
    .flatMap((row) => row.toJSON().components)
    .map((component) => component.custom_id);

  assert.ok(!buttonIds.includes("games_menu_lootbox_player"));
  assert.ok(buttonIds.includes("games_menu_forca_player"));
  assert.ok(buttonIds.includes("games_menu_duelo_player"));
});

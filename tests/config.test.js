const test = require("node:test");
const assert = require("node:assert/strict");

test("static config loads editable data files", () => {
  const config = require("../scripts/core/config");
  assert.ok(config.paths.staticConfig.endsWith("data\\config") || config.paths.staticConfig.endsWith("data/config"));
  assert.ok(config.static.app.events.channelIds.length > 0);
  assert.ok(Object.keys(config.static.games.forca.themes).length > 0);
  assert.ok(Object.keys(config.static.games.trivia.questions).length > 0);
  assert.ok(Object.keys(config.static.shop.boosts).includes("game_2x"));
});

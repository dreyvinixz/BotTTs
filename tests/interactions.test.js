const test = require("node:test");
const assert = require("node:assert/strict");

test("games menu blocks clicks from non-owner", async () => {
  const { handleGamesInteraction } = require("../scripts/games/menu");
  const replies = [];
  const handled = await handleGamesInteraction({
    isButton: () => true,
    isModalSubmit: () => false,
    customId: "games_menu_forca_owner-id",
    user: { id: "other-id" },
    reply: async (payload) => replies.push(payload)
  });

  assert.equal(replies.length, 1);
  assert.match(replies[0].content, /Apenas quem digitou/);
});

test("admin command blocks non-superadmin", async () => {
  const { handleAdminCommand } = require("../scripts/admin/admin");
  const replies = [];
  const handled = await handleAdminCommand({
    content: "!spawn_boss",
    author: { id: "other-id" },
    reply: async (payload) => replies.push(payload)
  });

  assert.equal(handled, true);
  assert.match(replies[0], /Superadmin/);
});

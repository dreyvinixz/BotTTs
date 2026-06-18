const test = require("node:test");
const assert = require("node:assert/strict");

test("superadmin ids come from config/env", () => {
  process.env.SUPERADMIN_IDS = "admin-a,admin-b";
  const { isSuperAdmin } = require("../scripts/admin/admin");
  assert.equal(isSuperAdmin("admin-a"), true);
  assert.equal(isSuperAdmin("admin-b"), true);
  assert.equal(isSuperAdmin("not-admin"), false);
});

test("spawn boss admin command in test mode targets only the test channel", async () => {
  const { handleAdminCommand } = require("../scripts/admin/admin");
  const boss = require("../scripts/games/boss");
  const originalSpawnWorldBoss = boss.spawnWorldBoss;
  const replies = [];
  const testChannel = { id: "1348716118981742592", send: async () => ({ id: "msg", edit: async () => {} }) };
  let capturedChannels = null;

  boss.spawnWorldBoss = async (channels) => {
    capturedChannels = channels;
  };

  try {
    const handled = await handleAdminCommand({
      content: "!spawnboss",
      author: { id: "admin-a" },
      channelId: testChannel.id,
      channel: testChannel,
      client: {
        botTtsTestMode: true,
        botTtsTestChannelId: testChannel.id,
        channels: {
          cache: new Map(),
          fetch: async () => null
        }
      },
      reply: async (payload) => replies.push(payload)
    });

    assert.equal(handled, true);
    assert.equal(capturedChannels.length, 1);
    assert.equal(capturedChannels[0].id, testChannel.id);
    assert.match(replies[0], /canal de teste/);
  } finally {
    boss.spawnWorldBoss = originalSpawnWorldBoss;
  }
});

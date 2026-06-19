const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const reels = require("../scripts/features/reels");

test("reels command payload exposes panel actions", () => {
  const payload = reels.buildReelsPanelPayload("owner1");
  const buttons = payload.components[0].components.map((button) => button.data.custom_id);

  assert.equal(payload.embeds[0].data.title, "🎬 Painel de Reels");
  assert.deepEqual(buttons, [
    "reels_random_owner1",
    "reels_link_owner1",
    "reels_delete_owner1"
  ]);
});

test("reels random button sends through scheduler and remembers sent message", async () => {
  reels.__lastCommandReelByChannel.clear();
  let deferred = false;
  let edited = "";

  const handled = await reels.handleReelsInteraction({
    customId: "reels_random_owner1",
    user: { id: "owner1" },
    client: {},
    channel: { id: "chan1", send: async () => {} },
    channelId: "chan1",
    isButton: () => true,
    deferReply: async () => { deferred = true; },
    editReply: async (content) => { edited = content; }
  }, {
    runVideoJobOnce: async (client, options) => {
      await options.onSentMessage({ id: "msg1", channelId: "chan1" });
      return { ok: true };
    }
  });

  assert.equal(handled, true);
  assert.equal(deferred, true);
  assert.equal(edited, "✅ Reel aleatório enviado neste chat.");
  assert.equal(reels.__lastCommandReelByChannel.get("chan1"), "msg1");
});

test("reels delete button removes remembered message", async () => {
  reels.__lastCommandReelByChannel.set("chan2", "msg2");
  let deleted = false;
  let replyPayload;

  const handled = await reels.handleReelsInteraction({
    customId: "reels_delete_owner1",
    user: { id: "owner1" },
    channelId: "chan2",
    channel: {
      messages: {
        fetch: async (messageId) => {
          assert.equal(messageId, "msg2");
          return { delete: async () => { deleted = true; } };
        }
      }
    },
    isButton: () => true,
    reply: async (payload) => { replyPayload = payload; }
  });

  assert.equal(handled, true);
  assert.equal(deleted, true);
  assert.equal(replyPayload.content, "🧹 Último reel do painel apagado.");
  assert.equal(reels.__lastCommandReelByChannel.has("chan2"), false);
});

test("reels modal can send a provided link without touching the video bank", async () => {
  reels.__lastCommandReelByChannel.clear();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-reels-"));
  const filePath = path.join(dir, "linked.mp4");
  fs.writeFileSync(filePath, "mp4", "utf8");

  let deferred = false;
  let edited = "";
  let sentPayload;
  let savedUrl = "";

  const handled = await reels.handleReelsInteraction({
    customId: "reels_link_modal_owner1",
    user: { id: "owner1" },
    channelId: "chan3",
    channel: {
      send: async (payload) => {
        sentPayload = payload;
        return { id: "msg3", channelId: "chan3" };
      }
    },
    isModalSubmit: () => true,
    fields: {
      getTextInputValue: () => "https://www.instagram.com/reel/abc/"
    },
    deferReply: async () => { deferred = true; },
    editReply: async (content) => { edited = content; },
    reply: async () => {
      throw new Error("unexpected validation reply");
    }
  }, {
    addVideoUrl: (url, meta) => {
      savedUrl = url;
      assert.equal(meta.addedBy, "owner1");
      assert.equal(meta.source, "reels_panel");
      return { added: true, video: { id: "video_010", url } };
    },
    resolveAndDownloadVideo: async (video) => {
      assert.equal(video.url, "https://www.instagram.com/reel/abc/");
      return { filePath, bytes: 3 };
    }
  });

  assert.equal(handled, true);
  assert.equal(deferred, true);
  assert.equal(edited, "✅ Reel enviado pelo link. Salvei esse link no banco de reels.");
  assert.equal(sentPayload.files[0].name.endsWith(".mp4"), true);
  assert.equal(reels.__lastCommandReelByChannel.get("chan3"), "msg3");
  assert.equal(savedUrl, "https://www.instagram.com/reel/abc/");
  assert.equal(fs.existsSync(filePath), false);
});

test("reels modal tells the user when the sent link already exists in the bank", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-reels-duplicate-"));
  const filePath = path.join(dir, "linked.mp4");
  fs.writeFileSync(filePath, "mp4", "utf8");

  let edited = "";

  const handled = await reels.handleReelsInteraction({
    customId: "reels_link_modal_owner1",
    user: { id: "owner1" },
    channelId: "chan-dup",
    channel: {
      send: async () => ({ id: "msg-dup", channelId: "chan-dup" })
    },
    isModalSubmit: () => true,
    fields: {
      getTextInputValue: () => "https://www.instagram.com/reel/abc/"
    },
    deferReply: async () => {},
    editReply: async (content) => { edited = content; }
  }, {
    addVideoUrl: () => ({ added: false, reason: "duplicate_url", video: { id: "video_001" } }),
    resolveAndDownloadVideo: async () => ({ filePath, bytes: 3 })
  });

  assert.equal(handled, true);
  assert.equal(edited, "✅ Reel enviado pelo link. Esse link já estava no banco de reels.");
  assert.equal(fs.existsSync(filePath), false);
});

test("reels modal rejects files above the Discord upload limit before sending", async () => {
  reels.__lastCommandReelByChannel.clear();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-reels-large-"));
  const filePath = path.join(dir, "large.mp4");
  fs.writeFileSync(filePath, "large", "utf8");

  let edited = "";
  let sendCalled = false;

  const handled = await reels.handleReelsInteraction({
    customId: "reels_link_modal_owner1",
    user: { id: "owner1" },
    channelId: "chan-large",
    channel: {
      send: async () => {
        sendCalled = true;
      }
    },
    isModalSubmit: () => true,
    fields: {
      getTextInputValue: () => "https://www.instagram.com/reel/abc/"
    },
    deferReply: async () => {},
    editReply: async (content) => { edited = content; }
  }, {
    uploadMaxBytes: 4,
    resolveAndDownloadVideo: async () => ({ filePath, bytes: 5 })
  });

  assert.equal(handled, true);
  assert.equal(sendCalled, false);
  assert.match(edited, /grande demais/);
  assert.equal(fs.existsSync(filePath), false);
});

test("reels modal reports Discord request entity too large errors", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-reels-413-"));
  const filePath = path.join(dir, "small-but-rejected.mp4");
  fs.writeFileSync(filePath, "mp4", "utf8");

  let edited = "";

  const handled = await reels.handleReelsInteraction({
    customId: "reels_link_modal_owner1",
    user: { id: "owner1" },
    channelId: "chan-413",
    channel: {
      send: async () => {
        throw new Error("Request entity too large");
      }
    },
    isModalSubmit: () => true,
    fields: {
      getTextInputValue: () => "https://www.instagram.com/reel/abc/"
    },
    deferReply: async () => {},
    editReply: async (content) => { edited = content; }
  }, {
    uploadMaxBytes: 10,
    resolveAndDownloadVideo: async () => ({ filePath, bytes: 3 })
  });

  assert.equal(handled, true);
  assert.match(edited, /grande demais/);
  assert.equal(fs.existsSync(filePath), false);
});

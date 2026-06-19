const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  addVideoUrl,
  getNextVideo,
  markVideoSent,
  readHistory,
  readVideos,
  recordVideoFailure,
  saveHistory,
  saveVideos,
  selectVideo
} = require("../scripts/core/videoStore");

function tempStorePaths() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-video-store-"));
  return {
    videosPath: path.join(dir, "videos.json"),
    historyPath: path.join(dir, "history.json")
  };
}

test("video store selects active videos while avoiding recent history", () => {
  const videos = [
    { id: "a", url: "https://www.instagram.com/reel/a/", active: true, failures: 0 },
    { id: "b", url: "https://www.instagram.com/reel/b/", active: true, failures: 0 }
  ];
  const selected = selectVideo(videos, [{ videoId: "a", sentAt: 1 }], {
    recentLimit: 1,
    rng: () => 0
  });

  assert.equal(selected.id, "b");
});

test("video store persists sent history and disables repeated failures", () => {
  const paths = tempStorePaths();
  saveVideos([
    { id: "a", url: "https://www.instagram.com/reel/a/", active: true, title: "A" }
  ], paths);
  saveHistory([], paths);

  markVideoSent("a", { channelIds: ["chan"], bytes: 123, sentAt: 10 }, paths);
  assert.equal(readVideos(paths)[0].lastSentAt, 10);
  assert.equal(readHistory(paths)[0].videoId, "a");

  recordVideoFailure("a", "quebrou", { ...paths, maxFailures: 1 });
  const disabled = readVideos(paths)[0];
  assert.equal(disabled.active, false);
  assert.equal(disabled.failures, 1);
  assert.match(disabled.lastFailureReason, /quebrou/);
  assert.equal(getNextVideo(paths), null);
});

test("video store adds manual reel links without duplicating urls", () => {
  const paths = tempStorePaths();
  saveVideos([
    { id: "video_002", url: "https://www.instagram.com/reel/a/", active: true, title: "A" }
  ], paths);

  const added = addVideoUrl("https://www.instagram.com/reel/b/", {
    title: "Link do painel",
    addedBy: "owner1",
    source: "reels_panel",
    addedAt: 123
  }, paths);

  assert.equal(added.added, true);
  assert.equal(added.video.id, "video_003");
  assert.equal(added.video.title, "Link do painel");
  assert.equal(added.video.addedBy, "owner1");
  assert.equal(readVideos(paths).length, 2);

  const duplicate = addVideoUrl("https://www.instagram.com/reel/b/", {}, paths);
  assert.equal(duplicate.added, false);
  assert.equal(duplicate.reason, "duplicate_url");
  assert.equal(readVideos(paths).length, 2);
});

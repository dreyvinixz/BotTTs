const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  runVideoJob,
  runVideoJobOnce,
  runVideoJobSafe
} = require("../scripts/core/videoScheduler");
const {
  readHistory,
  saveHistory,
  saveVideos
} = require("../scripts/core/videoStore");

function tempStorePaths() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-video-scheduler-"));
  return {
    dir,
    videosPath: path.join(dir, "videos.json"),
    historyPath: path.join(dir, "history.json")
  };
}

test("video scheduler prevents overlapping cycles", async () => {
  let release;
  const blocker = new Promise((resolve) => {
    release = resolve;
  });
  let calls = 0;

  const first = runVideoJobSafe({}, {
    scheduleNext: false,
    runJob: async () => {
      calls += 1;
      await blocker;
    }
  });
  const second = await runVideoJobSafe({}, {
    scheduleNext: false,
    runJob: async () => {
      calls += 1;
    }
  });

  assert.equal(second, false);
  release();
  assert.equal(await first, true);
  assert.equal(calls, 1);
});

test("manual video job uses direct channel and shares overlap lock", async () => {
  let release;
  const blocker = new Promise((resolve) => {
    release = resolve;
  });

  const first = runVideoJobOnce({}, {
    runJob: async () => {
      await blocker;
      return { ok: true };
    }
  });
  const second = await runVideoJobOnce({}, {
    runJob: async () => ({ ok: true })
  });

  assert.equal(second.ok, false);
  assert.equal(second.reason, "already_running");
  release();
  assert.deepEqual(await first, { ok: true });
});

test("video job sends temp MP4 once and deletes local file", async () => {
  const paths = tempStorePaths();
  const tempVideoPath = path.join(paths.dir, "downloaded.mp4");
  saveVideos([
    { id: "video_001", url: "https://www.instagram.com/reel/ok/", active: true, title: "Teste" }
  ], paths);
  saveHistory([], paths);

  const sent = [];
  const client = {
    channels: {
      cache: new Map([["chan", {
        id: "chan",
        send: async (payload) => {
          sent.push(payload);
        }
      }]]),
      fetch: async () => null
    }
  };

  const result = await runVideoJob(client, {
    channelIds: ["chan"],
    storeOptions: paths,
    resolveAndDownload: async () => {
      fs.writeFileSync(tempVideoPath, "mp4", "utf-8");
      return { filePath: tempVideoPath, bytes: 3, directUrl: "https://cdn.example/video.mp4" };
    },
    channelDelayMs: 0
  });

  assert.equal(result.ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].files[0].name, "video_001.mp4");
  assert.equal(fs.existsSync(tempVideoPath), false);
  assert.equal(readHistory(paths)[0].videoId, "video_001");
});

test("video job can send to direct channel objects without configured ids", async () => {
  const paths = tempStorePaths();
  const tempVideoPath = path.join(paths.dir, "downloaded-direct.mp4");
  saveVideos([
    { id: "video_002", url: "https://www.instagram.com/reel/ok2/", active: true, title: "Direto" }
  ], paths);
  saveHistory([], paths);

  const sent = [];
  const result = await runVideoJob({}, {
    channels: [{
      id: "current-channel",
      send: async (payload) => sent.push(payload)
    }],
    storeOptions: paths,
    resolveAndDownload: async () => {
      fs.writeFileSync(tempVideoPath, "mp4", "utf-8");
      return { filePath: tempVideoPath, bytes: 3, directUrl: "https://cdn.example/video.mp4" };
    },
    channelDelayMs: 0
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.channelIds, ["current-channel"]);
  assert.equal(sent.length, 1);
  assert.equal(fs.existsSync(tempVideoPath), false);
});

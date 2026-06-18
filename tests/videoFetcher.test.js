const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  resolveAndDownloadVideo,
  validateInstagramUrl
} = require("../scripts/core/videoFetcher");

function streamFromText(text) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    }
  });
}

test("video fetcher resolves provider URL and downloads MP4 to temp file", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-video-"));
  const fetchImpl = async (url, options = {}) => {
    if (url === "https://provider.example/api") {
      return new Response(JSON.stringify({ url: "https://cdn.example/video.mp4" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    if (options.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: { "content-type": "video/mp4", "content-length": "4" }
      });
    }
    return new Response(streamFromText("1234"), {
      status: 200,
      headers: { "content-type": "video/mp4", "content-length": "4" }
    });
  };

  const result = await resolveAndDownloadVideo({
    id: "video_ok",
    url: "https://www.instagram.com/reel/test/"
  }, {
    providerUrl: "https://provider.example/api",
    fetchImpl,
    tmpDir,
    maxBytes: 10
  });

  assert.equal(result.bytes, 4);
  assert.equal(fs.readFileSync(result.filePath, "utf-8"), "1234");
  await fs.promises.unlink(result.filePath);
});

test("video fetcher rejects non-instagram source and oversized downloads", async () => {
  assert.throws(() => validateInstagramUrl("https://example.com/reel/test/"), /Instagram/);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bottts-video-"));
  const fetchImpl = async (url, options = {}) => {
    if (url === "https://provider.example/api") {
      return new Response(JSON.stringify({ url: "https://cdn.example/video.mp4" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    if (options.method === "HEAD") {
      return new Response(null, { status: 405 });
    }
    return new Response(streamFromText("12345"), {
      status: 200,
      headers: { "content-type": "video/mp4" }
    });
  };

  await assert.rejects(
    () => resolveAndDownloadVideo({
      id: "too_big",
      url: "https://www.instagram.com/reel/test/"
    }, {
      providerUrl: "https://provider.example/api",
      fetchImpl,
      tmpDir,
      maxBytes: 4
    }),
    /excedeu/
  );

  assert.deepEqual(fs.readdirSync(tmpDir), []);
});

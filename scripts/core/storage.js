const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error(`Erro ao ler JSON ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFileSync(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
}

function createDebouncedJsonWriter(filePath, getValue, delayMs = 2000) {
  let timeout = null;
  let isSaving = false;

  return function scheduleWrite() {
    if (timeout) return;
    timeout = setTimeout(async () => {
      if (isSaving) return;
      isSaving = true;
      try {
        ensureDir(path.dirname(filePath));
        await fsPromises.writeFile(filePath, JSON.stringify(getValue(), null, 2), "utf-8");
      } catch (err) {
        console.error(`Erro ao salvar JSON ${filePath}:`, err);
      } finally {
        isSaving = false;
        timeout = null;
      }
    }, delayMs);
  };
}

module.exports = {
  ensureDir,
  readJsonFile,
  writeJsonFileSync,
  createDebouncedJsonWriter
};

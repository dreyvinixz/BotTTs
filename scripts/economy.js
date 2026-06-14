const fs = require("fs");
const config = require("./config");

let db = {};

function carregarEconomia() {
  try {
    if (fs.existsSync(config.ECONOMIA_PATH)) {
      const data = fs.readFileSync(config.ECONOMIA_PATH, "utf-8");
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro ao carregar economia:", err);
  }
}

function salvarEconomia() {
  try {
    fs.writeFileSync(config.ECONOMIA_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar economia:", err);
  }
}

function getCoins(userId) {
  if (!db[userId]) {
    return 0;
  }
  return db[userId];
}

function addCoins(userId, amount) {
  if (!db[userId]) {
    db[userId] = 0;
  }
  db[userId] += amount;
  salvarEconomia();
  return db[userId];
}

function removeCoins(userId, amount) {
  if (!db[userId]) {
    db[userId] = 0;
  }
  db[userId] -= amount;
  if (db[userId] < 0) {
    db[userId] = 0; // Evita saldo negativo por enquanto
  }
  salvarEconomia();
  return db[userId];
}

// Carrega o banco de dados assim que o arquivo é inicializado
carregarEconomia();

function getTopPlayers(limit = 10) {
  return Object.entries(db)
    .sort((a, b) => b[1] - a[1]) // sort descending by balance
    .slice(0, limit)
    .map(([id, balance]) => ({ id, balance }));
}

module.exports = {
  getCoins,
  addCoins,
  removeCoins,
  getTopPlayers
};

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveDuel,
  parsePositiveAmount,
  computeStealChance,
  rollStealPercent,
  selectParrudoOption
} = require("../scripts/games/duelRules");

test("duel rules resolve wins and draws from config map", () => {
  const p1 = { id: "1", choice: "Ataque" };
  const p2 = { id: "2", choice: "Magia" };
  assert.equal(resolveDuel(p1, p2).winner, p1);
  assert.equal(resolveDuel({ ...p1, choice: "Magia" }, { ...p2, choice: "Defesa" }).winner.id, "1");
  assert.equal(resolveDuel({ ...p1, choice: "Defesa" }, { ...p2, choice: "Ataque" }).winner.id, "1");
  assert.equal(resolveDuel({ ...p1, choice: "Ataque" }, { ...p2, choice: "Ataque" }).winner, null);
});

test("duel helper parsing and steal math are deterministic", () => {
  assert.equal(parsePositiveAmount("100"), 100);
  assert.equal(parsePositiveAmount("0"), null);
  assert.ok(Math.abs(computeStealChance({ boostChance: 0.2, isSuperAdmin: true }) - 0.8) < 1e-9);
  assert.equal(rollStealPercent(false, () => 0.5), 0.30000000000000004);
  assert.deepEqual(selectParrudoOption(2), { maxRequestedHours: 2, cost: 500, hours: 2 });
});

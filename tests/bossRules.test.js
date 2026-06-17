const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getBossTypeConfig,
  getBossPhase,
  computeBossAttackDamage,
  computeBossPrizes
} = require("../scripts/games/bossRules");

test("mini boss uses 5k prize and configured hp", () => {
  const mini = getBossTypeConfig("mini");
  assert.equal(mini.prize, 5000);
  assert.equal(mini.hp, 5000);
});

test("boss phases and damage are deterministic with injected rng", () => {
  const phase = getBossPhase(2000, 10000);
  const attack = computeBossAttackDamage({ actionId: "heavy", hp: 2000, maxHp: 10000, weaponDamage: 100, rng: () => 0 });

  assert.equal(phase.id, "final");
  assert.ok(attack.damage >= 220);
});

test("boss prizes include top bonuses", () => {
  const prizes = computeBossPrizes(new Map([["a", 7000], ["b", 3000]]), 10000, 10000, [0.1], 1);
  assert.equal(prizes[0].userId, "a");
  assert.equal(prizes[0].prize, 8000);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const economy = require("../scripts/economy/economy");
const inventory = require("../scripts/economy/inventory");
const ledger = require("../scripts/economy/ledger");
const raids = require("../scripts/economy/raids");

inventory.__disableSavingForTests(true);
ledger.__disableSavingForTests(true);
raids.__disableSavingForTests(true);

function seedServers() {
  raids.__setDbForTests(
    { raids: {}, userCooldowns: {} },
    {
      servers: {
        guild_a: {
          guildId: "guild_a",
          name: "Reino Alpha",
          eventChannelId: "chan_a",
          enabled: true,
          canAttack: true,
          canBeRaided: true,
          lastAttackAt: 0,
          lastRaidedAt: 0,
          shieldUntil: 0
        },
        guild_b: {
          guildId: "guild_b",
          name: "Reino Beta",
          eventChannelId: "chan_b",
          enabled: true,
          canAttack: true,
          canBeRaided: true,
          lastAttackAt: 0,
          lastRaidedAt: 0,
          shieldUntil: 0
        },
        guild_c: {
          guildId: "guild_c",
          name: "Servidor Desativado",
          eventChannelId: "chan_c",
          enabled: false,
          canAttack: true,
          canBeRaided: true,
          lastAttackAt: 0,
          lastRaidedAt: 0,
          shieldUntil: 0
        }
      }
    }
  );
}

test("raidable servers hide self and disabled servers", () => {
  seedServers();

  const servers = raids.getRaidableServers("guild_a");

  assert.equal(servers.length, 1);
  assert.equal(servers[0].internalId, "1");
  assert.equal(servers[0].guildId, "guild_b");
});

test("raid lifecycle blocks stake, supports join start defense item and resolves safely", async () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({
    creator: 10000,
    ally: 1000,
    defender1: 2000,
    defender2: 600
  });
  inventory.__setDbForTests({});
  ledger.__setLedgerForTests([]);
  seedServers();

  const created = raids.createRaid({
    attackerGuildId: "guild_a",
    attackerChannelId: "chan_a",
    createdBy: "creator",
    targetInternalId: "1",
    stake: 5000
  });

  assert.equal(created.ok, true);
  assert.equal(economy.getCoins("creator"), 5000);
  assert.equal(created.raid.participants.length, 1);

  const joined = raids.joinRaid("ally", created.raid.id);
  assert.equal(joined.ok, true);

  const started = await raids.startRaid("creator", created.raid.id, null);
  assert.equal(started.ok, true);
  assert.equal(started.raid.status, "active");

  const defended = raids.defendRaid("defender1", "guild_b");
  assert.equal(defended.ok, true);

  economy.addCoins("defender1", 3000);
  const bought = raids.buyRaidItem("defender1", "escudo_servidor");
  assert.equal(bought.ok, true);
  assert.equal(inventory.__getDbForTests().defender1.items.escudo_servidor, 1);

  const used = raids.useRaidItem("defender1", "guild_b", "escudo_servidor");
  assert.equal(used.ok, true);
  assert.equal(inventory.__getDbForTests().defender1.items.escudo_servidor, undefined);

  const resolved = await raids.resolveRaid(created.raid.id, {
    rng: () => 0,
    eligibleTargets: [
      { userId: "defender1", balance: economy.getCoins("defender1") },
      { userId: "defender2", balance: economy.getCoins("defender2") }
    ]
  });

  assert.equal(resolved.ok, true);
  assert.equal(resolved.raid.status, "completed");
  assert.equal(economy.getCoins("defender2") >= 500, true);
  assert.equal(economy.getCoins("defender1") >= 500, true);
  assert.equal(resolved.result.totalStolen > 0, true);
  assert.equal(economy.getCoins("creator") > 5000, true);

  const db = raids.__getDbForTests();
  assert.equal(db.servers.servers.guild_a.lastAttackAt > 0, true);
  assert.equal(db.servers.servers.guild_b.shieldUntil > Date.now(), true);

  const eventTypes = ledger.__getLedgerForTests().map((event) => event.type);
  assert.equal(eventTypes.includes("raid_created"), true);
  assert.equal(eventTypes.includes("raid_joined"), true);
  assert.equal(eventTypes.includes("raid_started"), true);
  assert.equal(eventTypes.includes("raid_defended"), true);
  assert.equal(eventTypes.includes("raid_item_bought"), true);
  assert.equal(eventTypes.includes("raid_item_used"), true);
  assert.equal(eventTypes.includes("raid_steal_success"), true);
  assert.equal(eventTypes.includes("raid_tax"), true);
  assert.equal(eventTypes.includes("raid_reward_paid"), true);
  assert.equal(eventTypes.includes("raid_resolved"), true);
});

test("raid cancellation refunds stake and records ledger", () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ creator: 3000 });
  ledger.__setLedgerForTests([]);
  seedServers();

  const created = raids.createRaid({
    attackerGuildId: "guild_a",
    attackerChannelId: "chan_a",
    createdBy: "creator",
    targetInternalId: "1",
    stake: 2000
  });
  assert.equal(created.ok, true);
  assert.equal(economy.getCoins("creator"), 1000);

  const cancelled = raids.cancelRaid("creator", created.raid.id);
  assert.equal(cancelled.ok, true);
  assert.equal(economy.getCoins("creator"), 3000);
  assert.equal(ledger.__getLedgerForTests().at(-1).type, "raid_cancelled");
});

test("raid item cannot be used on wrong side or twice by same user", async () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ creator: 10000, ally: 1000, attacker: 5000 });
  inventory.__setDbForTests({});
  seedServers();

  const created = raids.createRaid({
    attackerGuildId: "guild_a",
    attackerChannelId: "chan_a",
    createdBy: "creator",
    targetInternalId: "1",
    stake: 5000
  });
  raids.joinRaid("ally", created.raid.id);
  await raids.startRaid("creator", created.raid.id, null);

  inventory.addItem("attacker", "escudo_servidor", 1);
  const wrongSide = raids.useRaidItem("attacker", "guild_a", "escudo_servidor");
  assert.equal(wrongSide.ok, false);

  inventory.addItem("attacker", "estandarte_guerra", 2);
  const first = raids.useRaidItem("attacker", "guild_a", "estandarte_guerra");
  const second = raids.useRaidItem("attacker", "guild_a", "estandarte_guerra");
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
});

test("test mode does not send raid alerts outside the test channel", async () => {
  economy.__disableSavingForTests(true);
  economy.__setDbForTests({ creator: 10000, ally: 1000 });
  seedServers();
  const created = raids.createRaid({
    attackerGuildId: "guild_a",
    attackerChannelId: "1348716118981742592",
    createdBy: "creator",
    targetInternalId: "1",
    stake: 5000
  });
  raids.joinRaid("ally", created.raid.id);

  let sent = 0;
  const fakeClient = {
    botTtsTestMode: true,
    botTtsTestChannelId: "1348716118981742592",
    channels: {
      cache: new Map(),
      fetch: async () => ({ send: async () => { sent += 1; } })
    }
  };

  const started = await raids.startRaid("creator", created.raid.id, fakeClient);
  assert.equal(started.ok, true);
  assert.equal(sent, 0);
});

test("raid_my_items button responds with user's raid inventory", async () => {
  inventory.__setDbForTests({});
  inventory.addItem("test_user_items", "escudo_servidor", 3);
  
  let calledUpdate = false;
  const interaction = {
    customId: "raid_my_items",
    user: { id: "test_user_items" },
    channelId: "1348716118981742592",
    client: { botTtsTestMode: true, botTtsTestChannelId: "1348716118981742592" },
    isButton: () => true,
    isRepliable: () => true,
    guildId: "guild_a",
    update: async (payload) => {
      calledUpdate = true;
      assert.equal(payload.embeds[0].data.title, "🎒 Meus Itens de Raid");
      assert.equal(payload.embeds[0].data.description.includes("x3"), true);
      assert.equal(payload.components[0].components[0].data.custom_id, "raid_shop");
      return true;
    }
  };
  
  const handled = await raids.handleRaidInteraction(interaction);
  assert.equal(calledUpdate, true);
  // handleRaidInteraction returns `undefined` implicitly for most button cases
});

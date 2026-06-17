const test = require("node:test");
const assert = require("node:assert/strict");

test("superadmin ids come from config/env", () => {
  process.env.SUPERADMIN_IDS = "admin-a,admin-b";
  const { isSuperAdmin } = require("../scripts/admin/admin");
  assert.equal(isSuperAdmin("admin-a"), true);
  assert.equal(isSuperAdmin("admin-b"), true);
  assert.equal(isSuperAdmin("not-admin"), false);
});

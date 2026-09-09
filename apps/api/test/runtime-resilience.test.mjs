import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test, { after } from "node:test";

const require = createRequire(import.meta.url);
const directory = mkdtempSync(join(tmpdir(), "crewith-resilience-"));
process.env.CREWITH_DATA_FILE = join(directory, "store.json");
after(() => rmSync(directory, { recursive: true, force: true }));
const { hashPassword, verifyPassword } = require("../dist/auth/password.js");
const store = require("../dist/mvp.store.js");

test("password verification rejects malformed inputs and preserves legacy migration", () => {
  for (const value of [null, undefined, 1, {}, [], ""]) {
    assert.deepEqual(verifyPassword(value, "fixture"), { ok: false, needsRehash: false });
    assert.deepEqual(verifyPassword("fixture", value), { ok: false, needsRehash: false });
  }
  assert.deepEqual(verifyPassword("fixture", "fixture"), { ok: true, needsRehash: true });
  assert.deepEqual(verifyPassword("wrong", "fixture"), { ok: false, needsRehash: false });
  const hash = hashPassword("fixture-password");
  assert.deepEqual(verifyPassword("fixture-password", hash), { ok: true, needsRehash: false });
  assert.deepEqual(verifyPassword("wrong", hash), { ok: false, needsRehash: false });
  assert.deepEqual(verifyPassword("fixture-password", "$2b$invalid"), { ok: false, needsRehash: false });
});

test("fee aggregation preserves statuses, member order, exclusions and empty totals", () => {
  const fee = { id: "fixture-fee", title: "Fixture", amount: 100 };
  const empty = store.buildFeeItem(fee);
  assert.equal(empty.targetCount, 0);
  assert.equal(empty.collectionRate, 100);
  for (const [index, status] of ["active", "active", "active", "dormant"].entries()) {
    const id = `fixture-${index}`;
    store.members.push({ id, name: id });
    store.clubMemberships.push({ clubId: store.club.id, memberId: id, memberStatus: status });
  }
  store.feePayments[fee.id] = { "fixture-0": "paid", "fixture-1": "exempt", "fixture-3": "paid" };
  const mixed = store.buildFeeItem(fee);
  assert.deepEqual([mixed.targetCount, mixed.paidCount, mixed.exemptCount, mixed.unpaidCount, mixed.collectionRate], [3, 1, 1, 1, 50]);
  assert.deepEqual(mixed.payments.map(item => [item.memberId, item.status]), [
    ["fixture-0", "paid"], ["fixture-1", "exempt"], ["fixture-2", "unpaid"],
  ]);
  assert.deepEqual(fee, { id: "fixture-fee", title: "Fixture", amount: 100 });
  store.feePayments[fee.id] = { "fixture-0": "exempt", "fixture-1": "exempt", "fixture-2": "exempt" };
  assert.equal(store.buildFeeItem(fee).collectionRate, 100);
  assert.throws(() => store.buildFeeItem(fee, "missing-club"), /Club not found/);
});

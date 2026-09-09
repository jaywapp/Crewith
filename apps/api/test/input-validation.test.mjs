import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
require("reflect-metadata");
const { AppController } = require("../dist/app.controller.js");
const { Logger } = require("@nestjs/common");

test("invalid creation and attendance inputs never reach either repository implementation", t => {
  const logs = [];
  t.mock.method(Logger.prototype, "warn", value => logs.push(value));
  const calls = [];
  const repository = new Proxy({}, { get: (_, key) => (...args) => { calls.push([key, args]); return { id: "fixture" }; } });
  const controller = new AppController(repository, {});
  const invalid = fn => assert.throws(fn, error => error.getStatus() === 400);
  for (const body of [undefined, null, [], {}, { title: 123 }, { title: "  " }]) {
    invalid(() => controller.createFee("club", body));
    invalid(() => controller.createEvent("club", body));
    invalid(() => controller.createNotice("club", body));
    invalid(() => controller.updateEventAttendance("club", "event", body));
  }
  invalid(() => controller.createNotice("club", { title: "private fixture", body: {} }));
  invalid(() => controller.updateEventAttendance("club", "event", { memberId: "private fixture", status: "bad" }));
  assert.equal(calls.length, 0);
  assert.ok(logs.length > 0);
  assert.doesNotMatch(JSON.stringify(logs), /private fixture/);
  assert.deepEqual(controller.createFee("club", { title: "Valid", amount: 0 }), { data: { id: "fixture" } });
  assert.equal(calls.length, 1);
});

test("self checks remain before response validation and valid responses reach the repository", t => {
  t.mock.method(Logger.prototype, "warn", () => {});
  const calls = [];
  const controller = new AppController({ updateEventResponse: (...args) => { calls.push(args); return "saved"; } }, {});
  const user = { sub: "member" };
  assert.throws(() => controller.updateEventResponse("club", "event", { memberId: "other", response: "attending" }, user), error => error.getStatus() === 403);
  assert.throws(() => controller.updateEventResponse("club", "event", { memberId: "member", response: "invalid" }, user), error => error.getStatus() === 400);
  assert.equal(calls.length, 0);
  for (const response of ["attending", "not_attending"]) {
    assert.deepEqual(controller.updateEventResponse("club", "event", { memberId: "member", response }, user), { data: "saved" });
  }
  assert.equal(calls.length, 2);
});

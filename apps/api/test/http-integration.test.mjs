import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { startFixtureApi } from "./integration-harness.mjs";

test("real HTTP authentication, roles, and mutation integration", async (t) => {
  const fixture = await startFixtureApi();
  t.after(() => fixture.close());
  const { request, sessions, clubId } = fixture;
  const path = `/clubs/${clubId}`;
  const owner = sessions.owner.accessToken;
  const operator = sessions.operator.accessToken;
  const member = sessions.member.accessToken;

  await t.test("health is public and missing, malformed, expired tokens are rejected", async () => {
    assert.equal((await request("/health")).status, 200);
    for (const token of [undefined, "invalid-token", fixture.expiredToken()])
      assert.equal((await request(path + "/admin/overview", { token })).status, 401);
  });
  await t.test("owner and operator read admin data; members and outsiders cannot", async () => {
    for (const token of [owner, operator]) {
      const response = await request(path + "/admin/overview", { token });
      assert.equal(response.status, 200);
      assert.equal(response.body.data.club.id, clubId);
    }
    for (const token of [member, sessions.outsider.accessToken])
      assert.equal((await request(path + "/admin/overview", { token })).status, 403);
  });
  await t.test("fresh club resource collections are empty", async () => {
    for (const resource of ["events", "fees", "notices"])
      assert.deepEqual((await request(path + "/" + resource, { token: owner })).body.data, []);
  });
  await t.test("member reads own member view and cannot impersonate another member", async () => {
    assert.equal((await request(path + `/member-app/${sessions.member.memberId}`, { token: member })).status, 200);
    assert.equal((await request(path + `/member-app/${sessions.owner.memberId}`, { token: member })).status, 403);
  });
  await t.test("operator creates and edits event; member cannot mutate it", async () => {
    const created = await request(path + "/events", { method: "POST", token: operator, body: {
      title: "통합 일정", locationName: "임시 장소", startsAt: "2026-12-01T09:00:00Z", visibility: "all_members",
    } });
    assert.equal(created.status, 201);
    const eventPath = path + `/events/${created.body.data.id}`;
    assert.equal((await request(eventPath, { method: "PATCH", token: member, body: { title: "거절됨" } })).status, 403);
    const updated = await request(eventPath, { method: "PATCH", token: operator, body: { title: "수정 일정" } });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, "수정 일정");
    assert.equal((await request(eventPath + "/responses", { method: "PATCH", token: member,
      body: { memberId: sessions.member.memberId, response: "attending" } })).status, 200);
  });
  await t.test("invalid input returns 400 without modifying persistent data", async () => {
    const before = readFileSync(fixture.storePath, "utf8");
    for (const body of [{}, { title: " ", locationName: "test" }, { title: 42, locationName: "test" }])
      assert.equal((await request(path + "/events", { method: "POST", token: owner, body })).status, 400);
    assert.equal(readFileSync(fixture.storePath, "utf8"), before);
  });
  await t.test("operator creates and edits fee; member write fails", async () => {
    const created = await request(path + "/fees", { method: "POST", token: operator,
      body: { title: "통합 회비", amount: 1000, dueDate: "2026-12-31", feeType: "recurring" } });
    assert.equal(created.status, 201);
    const feePath = path + `/fees/${created.body.data.id}`;
    assert.equal((await request(feePath, { method: "PATCH", token: member, body: { amount: 2000 } })).status, 403);
    const updated = await request(feePath, { method: "PATCH", token: owner, body: { amount: 2000 } });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.amount, 2000);
  });
  await t.test("notice creation, update and self read are integrated", async () => {
    const created = await request(path + "/notices", { method: "POST", token: owner,
      body: { title: "통합 공지", body: "임시 본문", visibility: "all_members" } });
    assert.equal(created.status, 201);
    const noticePath = path + `/notices/${created.body.data.id}`;
    const updated = await request(noticePath, { method: "PATCH", token: operator, body: { title: "수정 공지" } });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, "수정 공지");
    assert.equal((await request(noticePath + "/read", { method: "PATCH", token: member,
      body: { memberId: sessions.member.memberId } })).status, 200);
    assert.equal((await request(noticePath + "/read", { method: "PATCH", token: member,
      body: { memberId: sessions.owner.memberId } })).status, 403);
  });
  await t.test("password reset cannot target an account outside the operator's club", async () => {
    const before = readFileSync(fixture.storePath, "utf8");
    const denied = await request(path + `/members/${sessions.outsider.memberId}/password`, {
      method: "PATCH", token: operator, body: { password: "rejected-fixture-password" },
    });
    assert.equal(denied.status, 403);
    assert.equal(readFileSync(fixture.storePath, "utf8"), before);
  });
  await t.test("password reset for a member of the same club remains functional", async () => {
    assert.equal((await request(path + `/members/${sessions.member.memberId}/password`, {
      method: "PATCH", token: owner, body: { password: "updated-fixture-password" },
    })).status, 200);
    await fixture.login("010-9900-0003", "updated-fixture-password");
  });
});

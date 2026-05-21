import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tempDir = mkdtempSync(join(tmpdir(), "crewith-api-test-"));

process.env.CREWITH_DATA_FILE = join(tempDir, "mvp-store.json");

require("reflect-metadata");

const store = require("../dist/mvp.store.js");
const { AppModule } = require("../dist/app.module.js");
const { Test } = require("@nestjs/testing");

test("store calculates dashboard summaries and reminder targets", () => {
  const fees = store.buildFees();
  const events = store.buildEvents();
  const notices = store.buildNotices();
  const dashboard = store.buildDashboard();
  const reminders = store.buildReminderTargets();

  assert.equal(fees[0].targetCount, 4);
  assert.equal(fees[0].paidCount, 3);
  assert.equal(fees[0].unpaidCount, 1);
  assert.equal(fees[0].collectionRate, 75);

  assert.equal(events[0].attendanceRate, 75);
  assert.equal(events[0].attendanceConversionRate, 100);

  assert.equal(notices[0].readCount, 3);
  assert.equal(notices[0].unreadCount, 1);

  assert.equal(dashboard.activeMemberCount, 4);
  assert.equal(dashboard.overdueMemberCount, 1);
  assert.equal(dashboard.noticeReadRate, 75);
  assert.equal(dashboard.monthlyFeeCollectionRate, 75);

  assert.deepEqual(
    reminders.map((reminder) => reminder.type),
    ["fee_overdue", "event_no_response", "notice_unread"],
  );
  assert.equal(reminders.reduce((sum, reminder) => sum + reminder.targetCount, 0), 3);
});

test("API serves overview and persists member app actions", async (t) => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1");
  await app.listen(0);
  t.after(async () => {
    await app.close();
  });

  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.status, "ok");

  const adminOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/admin/overview`);
  assert.equal(adminOverview.status, 200);
  assert.equal((await adminOverview.json()).data.club.name, "서울 러너스");

  const memberOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/member-03`);
  assert.equal(memberOverview.status, 200);
  assert.equal((await memberOverview.json()).data.member.name, "박도윤");

  const responseUpdate = await fetch(`${baseUrl}/clubs/club-seoul-runners/events/event-01/responses`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "member-03", response: "attending" }),
  });
  assert.equal(responseUpdate.status, 200);
  assert.equal((await responseUpdate.json()).data.notAttendingCount, 0);

  const noticeRead = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/notice-01/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "member-03" }),
  });
  assert.equal(noticeRead.status, 200);
  assert.equal((await noticeRead.json()).data.unreadCount, 0);
});

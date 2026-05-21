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

  const deniedOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/admin/overview`);
  assert.equal(deniedOverview.status, 403);

  const unknownClubOverview = await fetch(`${baseUrl}/clubs/unknown-club/admin/overview`, {
    headers: { "x-crewith-role": "operator" },
  });
  assert.equal(unknownClubOverview.status, 404);

  const adminOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/admin/overview`, {
    headers: { "x-crewith-role": "operator" },
  });
  assert.equal(adminOverview.status, 200);
  const adminOverviewJson = (await adminOverview.json()).data;
  assert.equal(adminOverviewJson.club.name, "서울 러너스");
  assert.equal(adminOverviewJson.feeSettings.dueDay, 25);

  const feeSettingsUpdate = await fetch(`${baseUrl}/clubs/club-seoul-runners/fee-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      amount: 35000,
      dueDay: 10,
      intervalType: "monthly",
      gracePeriodDays: 5,
      autoReminderEnabled: true,
      reminderDaysAfterDue: [1, 3],
    }),
  });
  assert.equal(feeSettingsUpdate.status, 200);
  const feeSettings = (await feeSettingsUpdate.json()).data;
  assert.equal(feeSettings.amount, 35000);
  assert.equal(feeSettings.dueDay, 10);
  assert.deepEqual(feeSettings.reminderDaysAfterDue, [1, 3]);

  const createdInvite = await fetch(`${baseUrl}/clubs/club-seoul-runners/invite-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ expiresInDays: 30 }),
  });
  assert.equal(createdInvite.status, 201);
  const invite = (await createdInvite.json()).data;
  assert.equal(invite.disabled, false);

  const disabledInvite = await fetch(`${baseUrl}/clubs/club-seoul-runners/invite-links/${invite.id}/disable`, {
    method: "PATCH",
    headers: { "x-crewith-role": "operator" },
  });
  assert.equal(disabledInvite.status, 200);
  assert.equal((await disabledInvite.json()).data.disabled, true);

  const disabledInviteAccept = await fetch(`${baseUrl}/clubs/club-seoul-runners/invite-links/${invite.token}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicantName: "Invite Blocked", applicantPhone: "010-9999-0001" }),
  });
  assert.equal(disabledInviteAccept.status, 404);

  const importMembers = await fetch(`${baseUrl}/clubs/club-seoul-runners/members/imports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      rows: "테스트회원,010-7777-0001,member\n중복회원,010-1234-1003,member\n운영테스트\t010-7777-0002\toperator",
    }),
  });
  assert.equal(importMembers.status, 201);
  const importResult = (await importMembers.json()).data;
  assert.equal(importResult.createdCount, 2);
  assert.equal(importResult.skippedCount, 1);
  assert.equal(importResult.errors[0].row, 2);

  const memberOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/member-03`);
  assert.equal(memberOverview.status, 200);
  assert.equal((await memberOverview.json()).data.member.name, "박도윤");

  const otpRequest = await fetch(`${baseUrl}/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-1234-1003" }),
  });
  assert.equal(otpRequest.status, 201);

  const otpVerify = await fetch(`${baseUrl}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-1234-1003", code: "123456" }),
  });
  assert.equal(otpVerify.status, 201);
  const session = (await otpVerify.json()).data;
  assert.deepEqual(
    session.clubs.map((club) => club.clubId),
    ["club-seoul-runners", "club-seoul-riders"],
  );

  const deviceRegistration = await fetch(`${baseUrl}/me/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: session.memberId,
      platform: "android",
      fcmToken: `test-fcm-${session.memberId}`,
    }),
  });
  assert.equal(deviceRegistration.status, 201);
  assert.equal((await deviceRegistration.json()).data.memberId, session.memberId);

  const reminderSend = await fetch(`${baseUrl}/clubs/club-seoul-runners/reminders/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ reminderId: "fee:fee-2026-05" }),
  });
  assert.equal(reminderSend.status, 201);
  const reminderLog = (await reminderSend.json()).data;
  assert.equal(reminderLog.targetCount, 3);
  assert.equal(reminderLog.deliveredCount, 1);

  const memberNotifications = await fetch(`${baseUrl}/me/notifications?memberId=${session.memberId}`);
  assert.equal(memberNotifications.status, 200);
  const notification = (await memberNotifications.json()).data[0];
  assert.equal(notification.memberId, session.memberId);
  assert.equal(notification.title, "회비 미납 리마인더");
  assert.equal(notification.readAt, undefined);

  const notificationRead = await fetch(`${baseUrl}/me/notifications/${notification.id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: session.memberId }),
  });
  assert.equal(notificationRead.status, 200);
  assert.equal(typeof (await notificationRead.json()).data.readAt, "string");

  const secondClubOverview = await fetch(`${baseUrl}/clubs/club-seoul-riders/member-app/member-03`);
  assert.equal(secondClubOverview.status, 200);
  const secondClubOverviewJson = await secondClubOverview.json();
  assert.equal(secondClubOverviewJson.data.club.id, "club-seoul-riders");
  assert.equal(secondClubOverviewJson.data.member.role, "operator");

  const nonMemberClubOverview = await fetch(`${baseUrl}/clubs/club-seoul-riders/member-app/member-01`);
  assert.equal(nonMemberClubOverview.status, 404);

  const unknownClubMemberOverview = await fetch(`${baseUrl}/clubs/unknown-club/member-app/member-03`);
  assert.equal(unknownClubMemberOverview.status, 404);

  const responseUpdate = await fetch(`${baseUrl}/clubs/club-seoul-runners/events/event-01/responses`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "member-03", response: "attending" }),
  });
  assert.equal(responseUpdate.status, 200);
  assert.equal((await responseUpdate.json()).data.notAttendingCount, 2);

  const noticeRead = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/notice-01/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "member-03" }),
  });
  assert.equal(noticeRead.status, 200);
  assert.equal((await noticeRead.json()).data.unreadCount, 2);

  const noticeReaction = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/notice-01/reactions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "member-03" }),
  });
  assert.equal(noticeReaction.status, 200);
  assert.equal((await noticeReaction.json()).data.likeCount, 3);

  const noticeComment = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/notice-01/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "member-03", body: "앱에서 확인했습니다." }),
  });
  assert.equal(noticeComment.status, 201);
  const noticeCommentJson = (await noticeComment.json()).data;
  assert.equal(noticeCommentJson.commentCount, 2);

  const memberOverviewAfterNoticeActions = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/member-03`);
  assert.equal(memberOverviewAfterNoticeActions.status, 200);
  const noticeSummary = (await memberOverviewAfterNoticeActions.json()).data.notices[0];
  assert.equal(noticeSummary.read, true);
  assert.equal(noticeSummary.liked, true);
  assert.equal(noticeSummary.comments.at(-1).body, "앱에서 확인했습니다.");
});

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

test("store returns zero dashboard summaries when store is empty", () => {
  const fees = store.buildFees();
  const events = store.buildEvents();
  const notices = store.buildNotices();
  const dashboard = store.buildDashboard();
  const reminders = store.buildReminderTargets();

  assert.equal(fees.length, 0);
  assert.equal(events.length, 0);
  assert.equal(notices.length, 0);
  assert.equal(dashboard.totalMemberCount, 0);
  assert.equal(dashboard.activeMemberCount, 0);
  assert.equal(dashboard.overdueMemberCount, 0);
  assert.equal(dashboard.noticeReadRate, 100);
  assert.equal(dashboard.attendanceRate, 0);
  assert.equal(dashboard.monthlyFeeCollectionRate, 100);
  assert.equal(
    reminders.every((r) => r.targetCount === 0),
    true,
  );
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

  // Empty store: admin overview must not crash
  const emptyOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/admin/overview`, {
    headers: { "x-crewith-role": "operator" },
  });
  assert.equal(emptyOverview.status, 200);
  const emptyOverviewJson = (await emptyOverview.json()).data;
  assert.equal(emptyOverviewJson.club.name, "서울 러너스");
  assert.equal(emptyOverviewJson.feeSettings.dueDay, 25);
  assert.equal(emptyOverviewJson.privacySettings.showPhoneNumberToMembers, false);
  assert.equal(emptyOverviewJson.notificationSettings.feeReminderEnabled, true);

  // Create members one at a time so each gets a unique Date.now() ID
  const createMemberA = await fetch(`${baseUrl}/clubs/club-seoul-runners/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ name: "이회원", phoneNumber: "010-2222-0002", role: "member" }),
  });
  assert.equal(createMemberA.status, 201);
  const memberA = (await createMemberA.json()).data;

  const createMemberB = await fetch(`${baseUrl}/clubs/club-seoul-runners/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ name: "박회원", phoneNumber: "010-3333-0003", role: "member" }),
  });
  assert.equal(createMemberB.status, 201);
  const memberB = (await createMemberB.json()).data;

  assert.ok(memberA.id, "memberA should have an id");
  assert.ok(memberB.id, "memberB should have an id");
  assert.notEqual(memberA.id, memberB.id, "members should have distinct ids");

  // Import test: row 2 duplicates row 1's phone within the same batch
  const importMembers = await fetch(`${baseUrl}/clubs/club-seoul-runners/members/imports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      rows: "테스트회원,010-7777-0001,member\n중복회원,010-7777-0001,member\n운영테스트\t010-7777-0002\toperator",
    }),
  });
  assert.equal(importMembers.status, 201);
  const importResult = (await importMembers.json()).data;
  assert.equal(importResult.createdCount, 2);
  assert.equal(importResult.skippedCount, 1);
  assert.equal(importResult.errors[0].row, 2);

  const adminOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/admin/overview`, {
    headers: { "x-crewith-role": "operator" },
  });
  assert.equal(adminOverview.status, 200);
  const adminOverviewJson = (await adminOverview.json()).data;
  assert.equal(adminOverviewJson.club.name, "서울 러너스");
  assert.equal(adminOverviewJson.feeSettings.dueDay, 25);
  assert.equal(adminOverviewJson.privacySettings.showPhoneNumberToMembers, false);
  assert.equal(adminOverviewJson.notificationSettings.feeReminderEnabled, true);

  // Phone hidden by default for other members; own phone always visible
  const privateDirectory = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/${memberA.id}/members`);
  assert.equal(privateDirectory.status, 200);
  const privateDirectoryJson = (await privateDirectory.json()).data;
  const privateSelf = privateDirectoryJson.find((m) => m.id === memberA.id);
  const privateOther = privateDirectoryJson.find((m) => m.id === memberB.id);
  assert.equal(privateSelf.phoneNumber, "010-2222-0002");
  assert.equal(privateOther.phoneNumber, undefined);

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

  const privacySettingsUpdate = await fetch(`${baseUrl}/clubs/club-seoul-runners/privacy-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      showPhoneNumberToMembers: true,
      showBirthDateToMembers: false,
      showGenderToMembers: true,
    }),
  });
  assert.equal(privacySettingsUpdate.status, 200);
  const privacySettings = (await privacySettingsUpdate.json()).data;
  assert.equal(privacySettings.showPhoneNumberToMembers, true);
  assert.equal(privacySettings.showGenderToMembers, true);

  const notificationSettingsUpdate = await fetch(`${baseUrl}/clubs/club-seoul-runners/notification-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      eventReminderEnabled: true,
      eventReminderHoursBefore: [24, 2],
      feeReminderEnabled: false,
      feeReminderDaysAfterDue: [2, 5],
      noticeUnreadReminderEnabled: true,
      noticeUnreadReminderHoursAfter: [12, 24],
    }),
  });
  assert.equal(notificationSettingsUpdate.status, 200);
  const notificationSettings = (await notificationSettingsUpdate.json()).data;
  assert.equal(notificationSettings.feeReminderEnabled, false);
  assert.deepEqual(notificationSettings.eventReminderHoursBefore, [24, 2]);

  const remindersAfterFeeDisabled = await fetch(`${baseUrl}/clubs/club-seoul-runners/reminders`);
  assert.equal(remindersAfterFeeDisabled.status, 200);
  assert.equal(
    (await remindersAfterFeeDisabled.json()).data.some((reminder) => reminder.type === "fee_overdue"),
    false,
  );

  const notificationSettingsReenabled = await fetch(`${baseUrl}/clubs/club-seoul-runners/notification-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ feeReminderEnabled: true, feeReminderDaysAfterDue: [1, 3] }),
  });
  assert.equal(notificationSettingsReenabled.status, 200);

  // Public directory after privacy settings updated — other members' phones now visible
  const publicDirectory = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/${memberA.id}/members`);
  assert.equal(publicDirectory.status, 200);
  const publicDirectoryJson = (await publicDirectory.json()).data;
  const publicOther = publicDirectoryJson.find((m) => m.id === memberB.id);
  assert.equal(publicOther.phoneNumber, "010-3333-0003");
  assert.equal(publicOther.birthDate, undefined);

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

  const dormantMember = await fetch(`${baseUrl}/clubs/club-seoul-runners/members/${memberB.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ memberStatus: "dormant" }),
  });
  assert.equal(dormantMember.status, 200);
  const dormantMemberJson = (await dormantMember.json()).data;
  assert.equal(dormantMemberJson.memberStatus, "dormant");
  assert.equal(typeof dormantMemberJson.personalDataDeleteAt, "string");

  const reactivatedMember = await fetch(`${baseUrl}/clubs/club-seoul-runners/members/${memberB.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ memberStatus: "active" }),
  });
  assert.equal(reactivatedMember.status, 200);
  const reactivatedMemberJson = (await reactivatedMember.json()).data;
  assert.equal(reactivatedMemberJson.memberStatus, "active");
  assert.equal(reactivatedMemberJson.personalDataDeleteAt, undefined);

  const memberOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/${memberA.id}`);
  assert.equal(memberOverview.status, 200);
  assert.equal((await memberOverview.json()).data.member.name, "이회원");

  // Password login — default password is last 4 digits of phone: "010-2222-0002" → "0002"
  const loginWrongPassword = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-2222-0002", password: "wrong" }),
  });
  assert.equal(loginWrongPassword.status, 400);

  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-2222-0002", password: "0002" }),
  });
  assert.equal(loginResponse.status, 201);
  const session = (await loginResponse.json()).data;
  assert.equal(session.memberId, memberA.id);
  assert.deepEqual(
    session.clubs.map((c) => c.clubId),
    ["club-seoul-runners"],
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

  // Password reset
  const passwordReset = await fetch(`${baseUrl}/clubs/club-seoul-runners/members/${memberA.id}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ password: "newpass123" }),
  });
  assert.equal(passwordReset.status, 200);

  const loginWithNewPassword = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-2222-0002", password: "newpass123" }),
  });
  assert.equal(loginWithNewPassword.status, 201);

  const loginWithOldPassword = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-2222-0002", password: "0002" }),
  });
  assert.equal(loginWithOldPassword.status, 400);

  const unknownClubMemberOverview = await fetch(`${baseUrl}/clubs/unknown-club/member-app/${memberA.id}`);
  assert.equal(unknownClubMemberOverview.status, 404);

  const unknownMemberOverview = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/unknown-member`);
  assert.equal(unknownMemberOverview.status, 404);

  // No reminders sent yet — notifications should be empty
  const memberNotifications = await fetch(`${baseUrl}/me/notifications?memberId=${session.memberId}`);
  assert.equal(memberNotifications.status, 200);
  assert.equal(Array.isArray((await memberNotifications.json()).data), true);

  const createdEvent = await fetch(`${baseUrl}/clubs/club-seoul-runners/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      title: "테스트 일정",
      startsAt: "2026-06-01T19:00:00+09:00",
      locationName: "테스트 장소",
      locationAddress: "서울 테스트구",
      responseDeadline: "2026-06-01T18:00:00+09:00",
      visibility: "all_members",
    }),
  });
  assert.equal(createdEvent.status, 201);
  const createdEventJson = (await createdEvent.json()).data;

  const responseUpdate = await fetch(`${baseUrl}/clubs/club-seoul-runners/events/${createdEventJson.id}/responses`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: memberA.id, response: "attending" }),
  });
  assert.equal(responseUpdate.status, 200);

  const updatedEvent = await fetch(`${baseUrl}/clubs/club-seoul-runners/events/${createdEventJson.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ title: "수정된 테스트 일정", visibility: "operators_only" }),
  });
  assert.equal(updatedEvent.status, 200);
  const updatedEventJson = (await updatedEvent.json()).data;
  assert.equal(updatedEventJson.title, "수정된 테스트 일정");
  assert.equal(updatedEventJson.visibility, "operators_only");

  const deletedEvent = await fetch(`${baseUrl}/clubs/club-seoul-runners/events/${createdEventJson.id}`, {
    method: "DELETE",
    headers: { "x-crewith-role": "operator" },
  });
  assert.equal(deletedEvent.status, 200);
  assert.equal((await deletedEvent.json()).data.deleted, true);

  const createdNotice = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      title: "테스트 공지",
      body: "테스트 공지 본문",
      visibility: "all_members",
    }),
  });
  assert.equal(createdNotice.status, 201);
  const createdNoticeJson = (await createdNotice.json()).data;

  const noticeRead = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/${createdNoticeJson.id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: memberA.id }),
  });
  assert.equal(noticeRead.status, 200);

  const noticeReaction = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/${createdNoticeJson.id}/reactions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: memberA.id }),
  });
  assert.equal(noticeReaction.status, 200);
  assert.equal((await noticeReaction.json()).data.likeCount, 1);

  const commentBody = "앱에서 확인했습니다.";
  const noticeComment = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/${createdNoticeJson.id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: memberA.id, body: commentBody }),
  });
  assert.equal(noticeComment.status, 201);
  const noticeCommentJson = (await noticeComment.json()).data;
  assert.equal(noticeCommentJson.commentCount, 1);

  const memberOverviewAfterNoticeActions = await fetch(`${baseUrl}/clubs/club-seoul-runners/member-app/${memberA.id}`);
  assert.equal(memberOverviewAfterNoticeActions.status, 200);
  const noticeSummary = (await memberOverviewAfterNoticeActions.json()).data.notices[0];
  assert.equal(noticeSummary.read, true);
  assert.equal(noticeSummary.liked, true);
  assert.equal(noticeSummary.comments.at(-1).body, commentBody);

  const updatedNotice = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/${createdNoticeJson.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({
      title: "수정된 테스트 공지",
      body: "수정된 공지 본문",
      visibility: "operators_only",
    }),
  });
  assert.equal(updatedNotice.status, 200);
  const updatedNoticeJson = (await updatedNotice.json()).data;
  assert.equal(updatedNoticeJson.title, "수정된 테스트 공지");
  assert.equal(updatedNoticeJson.visibility, "operators_only");

  const deletedNotice = await fetch(`${baseUrl}/clubs/club-seoul-runners/notices/${createdNoticeJson.id}`, {
    method: "DELETE",
    headers: { "x-crewith-role": "operator" },
  });
  assert.equal(deletedNotice.status, 200);
  assert.equal((await deletedNotice.json()).data.deleted, true);

  // POST /auth/register — 성공
  const registerResponse = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "신규회원",
      phoneNumber: "010-9999-1234",
      password: "pass1234",
      birthDate: "1995-06-15",
    }),
  });
  assert.equal(registerResponse.status, 201);
  const registeredMemberId = (await registerResponse.json()).data.memberId;
  assert.ok(typeof registeredMemberId === "string" && registeredMemberId.startsWith("member-"));

  // 등록 후 로그인 가능
  const registerLoginResp = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-9999-1234", password: "pass1234" }),
  });
  assert.equal(registerLoginResp.status, 201);
  const registerSession = (await registerLoginResp.json()).data;
  assert.equal(registerSession.memberId, registeredMemberId);
  assert.equal(registerSession.clubs.length, 0); // 클럽 없음

  // 중복 전화번호로 재가입 시도 — 409
  const duplicateRegister = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "중복회원",
      phoneNumber: "010-9999-1234",
      password: "other",
    }),
  });
  assert.equal(duplicateRegister.status, 409);

  // acceptInvite — 이미 가입된 전화번호이면 기존 계정에 clubMembership만 추가
  // 먼저 초대 링크 생성
  const createInviteForReuse = await fetch(`${baseUrl}/clubs/club-seoul-runners/invite-links`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ expiresInDays: 7 }),
  });
  assert.equal(createInviteForReuse.status, 201);
  const reuseToken = (await createInviteForReuse.json()).data.token;

  const acceptWithExisting = await fetch(
    `${baseUrl}/clubs/club-seoul-runners/invite-links/${reuseToken}/accept`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        applicantName: "신규회원",
        applicantPhone: "010-9999-1234",
      }),
    },
  );
  assert.equal(acceptWithExisting.status, 201);
  const reuseResult = (await acceptWithExisting.json()).data;
  assert.equal(reuseResult.id, registeredMemberId); // 기존 계정 반환

  // 이제 로그인하면 클럽이 1개
  const afterInviteLogin = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-9999-1234", password: "pass1234" }),
  });
  assert.equal(afterInviteLogin.status, 201);
  const afterSession = (await afterInviteLogin.json()).data;
  assert.equal(afterSession.clubs.length, 1);
  assert.equal(afterSession.clubs[0].clubId, "club-seoul-runners");
});

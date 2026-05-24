import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AcceptInviteInput,
  type CreateFeedbackInput,
  type FeedbackResult,
  type AdminEventListItem,
  type AdminFeeListItem,
  type AdminInviteLinkListItem,
  type AdminJoinRequestListItem,
  type AdminMemberListItem,
  type AdminNoticeCommentListItem,
  type AdminNoticeListItem,
  type AdminNotificationLogItem,
  type MemberNotificationItem,
  type MemberDirectoryItem,
  type AuthLoginInput,
  type ResetMemberPasswordInput,
  type CreateAdminEventInput,
  type CreateAdminFeeInput,
  type CreateAdminMemberInput,
  type CreateAdminNoticeCommentInput,
  type CreateAdminNoticeInput,
  type CreateInviteLinkInput,
  type CreateJoinRequestInput,
  type FeePaymentStatus,
  type ImportAdminMembersInput,
  type ImportAdminMembersResult,
  type UpdateClubFeeSettingsInput,
  type UpdateClubNotificationSettingsInput,
  type UpdateClubPrivacySettingsInput,
  type RegisterDeviceInput,
  type ReviewJoinRequestInput,
  type SendReminderInput,
  type ToggleAdminNoticeReactionInput,
  type UpdateAdminAttendanceInput,
  type UpdateAdminEventInput,
  type UpdateAdminEventResponseInput,
  type UpdateAdminFeePaymentInput,
  type UpdateAdminMemberInput,
  type UpdateAdminNoticeReadInput,
  type UpdateAdminNoticeInput,
  type UpdateMemberProfileInput,
  buildEventItem,
  buildFeeItem,
  buildFees,
  buildEvents,
  buildMemberAppOverview,
  buildMemberDirectory,
  buildNoticeItem,
  buildNotices,
  buildOverview,
  buildProfile,
  buildReminderTargets,
  applyMemberPrivacyRetention,
  clubMemberships,
  clubMembershipSummaries,
  createMemberFromProfile,
  ensureClub,
  ensureEventTargets,
  ensureFeeSettings,
  ensureNotificationSettings,
  ensurePrivacySettings,
  ensureFeeTargets,
  eventAttendance,
  eventResponses,
  events,
  feePayments,
  fees,
  findEvent,
  findFee,
  findInviteByToken,
  findJoinRequest,
  findMember,
  findNotice,
  initializeMemberState,
  inviteLinks,
  isAttendanceStatus,
  isClubRole,
  isEventResponse,
  isFeePaymentStatus,
  isFeeType,
  feeSettings,
  notificationSettings,
  privacySettings,
  isMemberStatus,
  isResourceVisibility,
  joinRequests,
  memberDevices,
  memberNotifications,
  members,
  normalizePhoneNumber,
  noticeComments,
  noticeLikes,
  noticeReads,
  notices,
  notificationLogs,
  persistStore,
  profileImages,
  registerMemberDevice,
  visibleMembers,
} from "./mvp.store";

function cleanNonNegativeIntegerList(values: unknown[]) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0);
}

export abstract class MvpRepository {
  abstract getAdminOverview(clubId: string): ReturnType<typeof buildOverview>;
  abstract login(input: AuthLoginInput): unknown;
  abstract resetMemberPassword(memberId: string, input: ResetMemberPasswordInput): unknown;
  abstract registerDevice(input: RegisterDeviceInput): ReturnType<typeof registerMemberDevice>;
  abstract getMemberProfile(memberId: string): ReturnType<typeof buildProfile>;
  abstract updateMemberProfile(memberId: string, input: UpdateMemberProfileInput): ReturnType<typeof buildProfile>;
  abstract getMemberAppOverview(clubId: string, memberId: string): ReturnType<typeof buildMemberAppOverview>;
  abstract getMemberDirectory(clubId: string, memberId: string): MemberDirectoryItem[];
  abstract getMemberNotifications(memberId: string): MemberNotificationItem[];
  abstract markMemberNotificationRead(memberId: string, notificationId: string): MemberNotificationItem;
  abstract getReminderTargets(clubId: string): ReturnType<typeof buildReminderTargets>;
  abstract sendReminder(clubId: string, input: SendReminderInput): AdminNotificationLogItem;
  abstract getFeeSettings(clubId: string): ReturnType<typeof ensureFeeSettings>;
  abstract updateFeeSettings(clubId: string, input: UpdateClubFeeSettingsInput): ReturnType<typeof ensureFeeSettings>;
  abstract getNotificationSettings(clubId: string): ReturnType<typeof ensureNotificationSettings>;
  abstract updateNotificationSettings(
    clubId: string,
    input: UpdateClubNotificationSettingsInput,
  ): ReturnType<typeof ensureNotificationSettings>;
  abstract getPrivacySettings(clubId: string): ReturnType<typeof ensurePrivacySettings>;
  abstract updatePrivacySettings(
    clubId: string,
    input: UpdateClubPrivacySettingsInput,
  ): ReturnType<typeof ensurePrivacySettings>;
  abstract getMembers(clubId: string): AdminMemberListItem[];
  abstract getJoinRequests(clubId: string): AdminJoinRequestListItem[];
  abstract createJoinRequest(clubId: string, input: CreateJoinRequestInput): AdminJoinRequestListItem;
  abstract reviewJoinRequest(clubId: string, requestId: string, input: ReviewJoinRequestInput): AdminJoinRequestListItem;
  abstract getInviteLinks(clubId: string): AdminInviteLinkListItem[];
  abstract createInviteLink(clubId: string, input: CreateInviteLinkInput): AdminInviteLinkListItem;
  abstract disableInviteLink(clubId: string, inviteId: string): AdminInviteLinkListItem;
  abstract acceptInvite(clubId: string, token: string, input: AcceptInviteInput): AdminMemberListItem;
  abstract createMember(clubId: string, input: CreateAdminMemberInput): AdminMemberListItem;
  abstract importMembers(clubId: string, input: ImportAdminMembersInput): ImportAdminMembersResult;
  abstract updateMember(clubId: string, memberId: string, input: UpdateAdminMemberInput): AdminMemberListItem;
  abstract updateMemberFeeStatus(clubId: string, memberId: string, status: FeePaymentStatus): AdminMemberListItem;
  abstract removeMember(clubId: string, memberId: string): AdminMemberListItem;
  abstract getFees(clubId: string): AdminFeeListItem[];
  abstract createFee(clubId: string, input: CreateAdminFeeInput): AdminFeeListItem;
  abstract updateFeePayment(clubId: string, feeId: string, input: UpdateAdminFeePaymentInput): AdminFeeListItem;
  abstract updateEventAttendance(clubId: string, eventId: string, input: UpdateAdminAttendanceInput): AdminEventListItem;
  abstract getEvents(clubId: string): AdminEventListItem[];
  abstract createEvent(clubId: string, input: CreateAdminEventInput): AdminEventListItem;
  abstract updateEvent(clubId: string, eventId: string, input: UpdateAdminEventInput): AdminEventListItem;
  abstract deleteEvent(clubId: string, eventId: string): { id: string; deleted: true };
  abstract updateEventResponse(clubId: string, eventId: string, input: UpdateAdminEventResponseInput): AdminEventListItem;
  abstract getNotices(clubId: string): AdminNoticeListItem[];
  abstract createNotice(clubId: string, input: CreateAdminNoticeInput): AdminNoticeListItem;
  abstract updateNotice(clubId: string, noticeId: string, input: UpdateAdminNoticeInput): AdminNoticeListItem;
  abstract deleteNotice(clubId: string, noticeId: string): { id: string; deleted: true };
  abstract markNoticeRead(clubId: string, noticeId: string, input: UpdateAdminNoticeReadInput): AdminNoticeListItem;
  abstract toggleNoticeReaction(clubId: string, noticeId: string, input: ToggleAdminNoticeReactionInput): AdminNoticeListItem;
  abstract createNoticeComment(clubId: string, noticeId: string, input: CreateAdminNoticeCommentInput): AdminNoticeListItem;
  abstract createFeedback(input: CreateFeedbackInput): Promise<FeedbackResult>;
}

@Injectable()
export class JsonMvpRepository implements MvpRepository {
  getAdminOverview(clubId: string) {
    return buildOverview(clubId);
  }

  login(input: AuthLoginInput) {
    const phoneNumber = normalizePhoneNumber(input.phoneNumber ?? "");
    const password = `${input.password ?? ""}`.trim();

    const member = members.find(
      (m) => normalizePhoneNumber(m.phoneNumber) === phoneNumber && m.memberStatus !== "removed",
    );

    if (!member || member.password !== password) {
      throw new BadRequestException("전화번호 또는 비밀번호가 올바르지 않습니다.");
    }

    return {
      memberId: member.id,
      profile: buildProfile(member),
      clubs: clubMembershipSummaries(member.id),
    };
  }

  resetMemberPassword(memberId: string, input: ResetMemberPasswordInput) {
    const member = findMember(memberId);
    const newPassword = `${input.password ?? ""}`.trim();

    if (!newPassword) {
      throw new BadRequestException("비밀번호를 입력하세요.");
    }

    member.password = newPassword;
    persistStore();
    return { memberId: member.id };
  }

  registerDevice(input: RegisterDeviceInput) {
    return registerMemberDevice(input);
  }

  getMemberProfile(memberId: string) {
    return buildProfile(findMember(memberId));
  }

  updateMemberProfile(memberId: string, input: UpdateMemberProfileInput) {
    const member = findMember(memberId);

    if (input.name?.trim()) {
      member.name = input.name.trim();
    }

    if (input.phoneNumber?.trim()) {
      member.phoneNumber = normalizePhoneNumber(input.phoneNumber);
    }

    if (typeof input.profileImageUrl === "string") {
      const nextImageUrl = input.profileImageUrl.trim();
      if (nextImageUrl) {
        profileImages.set(member.id, nextImageUrl);
      } else {
        profileImages.delete(member.id);
      }
    }

    persistStore();
    return buildProfile(member);
  }

  getMemberAppOverview(clubId: string, memberId: string) {
    return buildMemberAppOverview(clubId, memberId);
  }

  getMemberDirectory(clubId: string, memberId: string) {
    return buildMemberDirectory(clubId, memberId);
  }

  getMemberNotifications(memberId: string) {
    findMember(memberId);
    return memberNotifications.filter((notification) => notification.memberId === memberId);
  }

  markMemberNotificationRead(memberId: string, notificationId: string) {
    findMember(memberId);
    const notification = memberNotifications.find(
      (item) => item.id === notificationId && item.memberId === memberId,
    );

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    notification.readAt ??= new Date().toISOString();
    persistStore();
    return notification;
  }

  getReminderTargets(clubId: string) {
    ensureClub(clubId);
    return buildReminderTargets(clubId);
  }

  sendReminder(clubId: string, input: SendReminderInput) {
    ensureClub(clubId);
    const reminder = buildReminderTargets(clubId).find((item) => item.id === input.reminderId);

    if (!reminder) {
      throw new NotFoundException("Reminder target not found");
    }

    const targetMemberIds = new Set(reminder.targets.map((target) => target.memberId));
    const deliveredCount = memberDevices.filter(
      (device) => !device.disabled && targetMemberIds.has(device.memberId),
    ).length;

    const log: AdminNotificationLogItem = {
      id: `notification-${Date.now()}`,
      type: reminder.type,
      title: reminder.title,
      targetCount: reminder.targetCount,
      sentAt: new Date().toISOString(),
      channel: "app_push",
      deliveredCount,
      skippedCount: Math.max(reminder.targetCount - deliveredCount, 0),
    };

    notificationLogs.unshift(log);

    for (const target of reminder.targets) {
      memberNotifications.unshift({
        id: `member-notification-${Date.now()}-${target.memberId}`,
        memberId: target.memberId,
        clubId,
        type: reminder.type,
        title: reminder.title,
        body: target.reason,
        createdAt: log.sentAt,
      });
    }

    persistStore();
    return log;
  }

  getFeeSettings(clubId: string) {
    return ensureFeeSettings(clubId);
  }

  updateFeeSettings(clubId: string, input: UpdateClubFeeSettingsInput) {
    const settings = ensureFeeSettings(clubId);

    const amount = Number(input.amount);
    if (Number.isFinite(amount) && amount >= 0) {
      settings.amount = amount;
    }

    const dueDay = Number(input.dueDay);
    if (Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31) {
      settings.dueDay = dueDay;
    }

    if (
      input.intervalType === "weekly" ||
      input.intervalType === "biweekly" ||
      input.intervalType === "monthly" ||
      input.intervalType === "quarterly" ||
      input.intervalType === "yearly" ||
      input.intervalType === "custom"
    ) {
      settings.intervalType = input.intervalType;
    }

    const customIntervalDays = Number(input.customIntervalDays);
    if (Number.isInteger(customIntervalDays) && customIntervalDays > 0) {
      settings.customIntervalDays = customIntervalDays;
    } else if (settings.intervalType !== "custom") {
      delete settings.customIntervalDays;
    }

    const gracePeriodDays = Number(input.gracePeriodDays);
    if (Number.isInteger(gracePeriodDays) && gracePeriodDays >= 0) {
      settings.gracePeriodDays = gracePeriodDays;
    }

    if (typeof input.autoReminderEnabled === "boolean") {
      settings.autoReminderEnabled = input.autoReminderEnabled;
    }

    if (Array.isArray(input.reminderDaysAfterDue)) {
      settings.reminderDaysAfterDue = input.reminderDaysAfterDue
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0)
        .slice(0, 10);
    }

    feeSettings[clubId] = settings;
    persistStore();
    return settings;
  }

  getNotificationSettings(clubId: string) {
    return ensureNotificationSettings(clubId);
  }

  updateNotificationSettings(clubId: string, input: UpdateClubNotificationSettingsInput) {
    const settings = ensureNotificationSettings(clubId);

    if (typeof input.eventReminderEnabled === "boolean") {
      settings.eventReminderEnabled = input.eventReminderEnabled;
    }

    if (Array.isArray(input.eventReminderHoursBefore)) {
      settings.eventReminderHoursBefore = cleanNonNegativeIntegerList(input.eventReminderHoursBefore).slice(0, 10);
    }

    if (typeof input.feeReminderEnabled === "boolean") {
      settings.feeReminderEnabled = input.feeReminderEnabled;
    }

    if (Array.isArray(input.feeReminderDaysAfterDue)) {
      settings.feeReminderDaysAfterDue = cleanNonNegativeIntegerList(input.feeReminderDaysAfterDue).slice(0, 10);
    }

    if (typeof input.noticeUnreadReminderEnabled === "boolean") {
      settings.noticeUnreadReminderEnabled = input.noticeUnreadReminderEnabled;
    }

    if (Array.isArray(input.noticeUnreadReminderHoursAfter)) {
      settings.noticeUnreadReminderHoursAfter = cleanNonNegativeIntegerList(input.noticeUnreadReminderHoursAfter).slice(0, 10);
    }

    notificationSettings[clubId] = settings;
    persistStore();
    return settings;
  }

  getPrivacySettings(clubId: string) {
    return ensurePrivacySettings(clubId);
  }

  updatePrivacySettings(clubId: string, input: UpdateClubPrivacySettingsInput) {
    const settings = ensurePrivacySettings(clubId);

    if (typeof input.showPhoneNumberToMembers === "boolean") {
      settings.showPhoneNumberToMembers = input.showPhoneNumberToMembers;
    }

    if (typeof input.showBirthDateToMembers === "boolean") {
      settings.showBirthDateToMembers = input.showBirthDateToMembers;
    }

    if (typeof input.showGenderToMembers === "boolean") {
      settings.showGenderToMembers = input.showGenderToMembers;
    }

    privacySettings[clubId] = settings;
    persistStore();
    return settings;
  }

  getMembers(clubId: string) {
    ensureClub(clubId);
    return visibleMembers(clubId);
  }

  getJoinRequests(clubId: string) {
    ensureClub(clubId);
    return joinRequests;
  }

  createJoinRequest(clubId: string, input: CreateJoinRequestInput) {
    ensureClub(clubId);
    const nextRequest: AdminJoinRequestListItem = {
      id: `join-${Date.now()}`,
      applicantName: input.applicantName.trim(),
      applicantPhone: input.applicantPhone.trim(),
      greeting: input.greeting.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    joinRequests.unshift(nextRequest);
    persistStore();
    return nextRequest;
  }

  reviewJoinRequest(clubId: string, requestId: string, input: ReviewJoinRequestInput) {
    ensureClub(clubId);
    const request = findJoinRequest(requestId);

    if (input.status === "approved" || input.status === "rejected") {
      request.status = input.status;
    }

    if (request.status === "approved") {
      const exists = members.some((member) => member.phoneNumber === request.applicantPhone);
      if (!exists) {
        const member = createMemberFromProfile(request.applicantName, request.applicantPhone);
        clubMemberships.push({
          clubId,
          memberId: member.id,
          role: "member",
          memberStatus: "active",
          joinedAt: member.joinedAt,
        });
      }
    }

    persistStore();
    return request;
  }

  getInviteLinks(clubId: string) {
    ensureClub(clubId);
    return inviteLinks;
  }

  createInviteLink(clubId: string, input: CreateInviteLinkInput) {
    ensureClub(clubId);
    const expiresInDays = Number(input.expiresInDays) || 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const nextInvite: AdminInviteLinkListItem = {
      id: `invite-${Date.now()}`,
      token: `CREWITH-${Date.now().toString().slice(-6)}`,
      expiresAt,
      disabled: false,
      createdAt: new Date().toISOString(),
    };

    inviteLinks.unshift(nextInvite);
    persistStore();
    return nextInvite;
  }

  disableInviteLink(clubId: string, inviteId: string) {
    ensureClub(clubId);
    const invite = inviteLinks.find((item) => item.id === inviteId);

    if (!invite) {
      throw new NotFoundException("Invite link not found");
    }

    invite.disabled = true;
    persistStore();
    return invite;
  }

  acceptInvite(clubId: string, token: string, input: AcceptInviteInput) {
    ensureClub(clubId);
    const invite = findInviteByToken(token);
    if (Date.parse(`${invite.expiresAt}T23:59:59+09:00`) < Date.now()) {
      throw new NotFoundException("Invite link expired");
    }

    const phoneDigits = input.applicantPhone.trim().replace(/\D/g, "");
    const member: AdminMemberListItem = {
      id: `member-${Date.now()}`,
      name: input.applicantName.trim(),
      phoneNumber: input.applicantPhone.trim(),
      role: "member",
      memberStatus: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
      lastFeeStatus: "unpaid",
      attendanceRate: 0,
      password: phoneDigits.slice(-4),
    };

    members.push(member);
    clubMemberships.push({
      clubId,
      memberId: member.id,
      role: "member",
      memberStatus: "active",
      joinedAt: member.joinedAt,
    });
    initializeMemberState(member);
    persistStore();
    return member;
  }

  createMember(clubId: string, input: CreateAdminMemberInput) {
    ensureClub(clubId);
    const phoneDigits = input.phoneNumber.trim().replace(/\D/g, "");
    const nextMember: AdminMemberListItem = {
      id: `member-${Date.now()}`,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
      role: isClubRole(input.role) ? input.role : "member",
      memberStatus: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
      lastFeeStatus: "unpaid",
      attendanceRate: 0,
      password: input.password?.trim() || phoneDigits.slice(-4),
    };

    members.push(nextMember);
    clubMemberships.push({
      clubId,
      memberId: nextMember.id,
      role: nextMember.role,
      memberStatus: nextMember.memberStatus,
      joinedAt: nextMember.joinedAt,
    });
    initializeMemberState(nextMember);
    persistStore();
    return nextMember;
  }

  importMembers(clubId: string, input: ImportAdminMembersInput): ImportAdminMembersResult {
    ensureClub(clubId);

    const errors: ImportAdminMembersResult["errors"] = [];
    const importedMembers: AdminMemberListItem[] = [];
    const rows = `${input.rows ?? ""}`
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean);

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 1;
      const columns = row.split(/\t|,/).map((column) => column.trim());
      const [name, phoneNumber, roleValue, passwordValue] = columns;

      if (!name || !phoneNumber) {
        errors.push({ row: rowNumber, reason: "Name and phone number are required", value: row });
        continue;
      }

      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
      const duplicate = visibleMembers(clubId).some(
        (member) => normalizePhoneNumber(member.phoneNumber) === normalizedPhoneNumber,
      );

      if (duplicate) {
        errors.push({ row: rowNumber, reason: "Duplicate phone number", value: row });
        continue;
      }

      const role = isClubRole(roleValue) ? roleValue : "member";
      const member = this.createMember(clubId, {
        name,
        phoneNumber: normalizedPhoneNumber,
        role,
        password: passwordValue?.trim() || undefined,
      });
      importedMembers.push(member);
    }

    return {
      createdCount: importedMembers.length,
      skippedCount: errors.length,
      errors,
      members: importedMembers,
    };
  }

  updateMember(clubId: string, memberId: string, input: UpdateAdminMemberInput) {
    ensureClub(clubId);
    const member = findMember(memberId);
    const membership = clubMemberships.find((item) => item.clubId === clubId && item.memberId === memberId);

    if (typeof input.name === "string" && input.name.trim()) {
      member.name = input.name.trim();
    }

    if (typeof input.phoneNumber === "string" && input.phoneNumber.trim()) {
      member.phoneNumber = input.phoneNumber.trim();
    }

    if (isClubRole(input.role)) {
      member.role = input.role;
      if (membership) {
        membership.role = input.role;
      }
    }

    if (isMemberStatus(input.memberStatus)) {
      applyMemberPrivacyRetention(member, input.memberStatus);
      if (membership) {
        membership.memberStatus = input.memberStatus;
      }
    }

    if (isFeePaymentStatus(input.lastFeeStatus)) {
      member.lastFeeStatus = input.lastFeeStatus;
      feePayments[fees[0].id][member.id] = input.lastFeeStatus;
    }

    if (typeof input.password === "string" && input.password.trim()) {
      member.password = input.password.trim();
    }

    persistStore();
    return member;
  }

  updateMemberFeeStatus(clubId: string, memberId: string, status: FeePaymentStatus) {
    ensureClub(clubId);
    const member = findMember(memberId);

    if (isFeePaymentStatus(status)) {
      member.lastFeeStatus = status;
    }

    persistStore();
    return member;
  }

  removeMember(clubId: string, memberId: string) {
    ensureClub(clubId);
    const member = findMember(memberId);
    applyMemberPrivacyRetention(member, "removed");
    const membership = clubMemberships.find((item) => item.clubId === clubId && item.memberId === memberId);
    if (membership) {
      membership.memberStatus = "removed";
    }
    persistStore();
    return member;
  }

  getFees(clubId: string) {
    ensureClub(clubId);
    return buildFees(clubId);
  }

  createFee(clubId: string, input: CreateAdminFeeInput) {
    ensureClub(clubId);
    const amount = Number(input.amount);
    const nextFee: AdminFeeListItem = {
      id: `fee-${Date.now()}`,
      title: input.title.trim(),
      feeType: isFeeType(input.feeType) ? input.feeType : "one_time",
      amount: Number.isFinite(amount) ? amount : 0,
      dueDate: input.dueDate,
      targetCount: 0,
      paidCount: 0,
      unpaidCount: 0,
      exemptCount: 0,
      collectionRate: 0,
      payments: [],
    };

    fees.unshift(nextFee);
    ensureFeeTargets(nextFee.id, clubId);
    persistStore();
    return buildFeeItem(nextFee, clubId);
  }

  updateFeePayment(clubId: string, feeId: string, input: UpdateAdminFeePaymentInput) {
    ensureClub(clubId);
    const fee = findFee(feeId);
    const member = findMember(input.memberId);

    if (isFeePaymentStatus(input.status)) {
      feePayments[feeId] ??= {};
      feePayments[feeId][member.id] = input.status;

      if (feeId === fees[0].id || fee.feeType === "recurring") {
        member.lastFeeStatus = input.status;
      }
    }

    persistStore();
    return buildFeeItem(fee, clubId);
  }

  updateEventAttendance(clubId: string, eventId: string, input: UpdateAdminAttendanceInput) {
    ensureClub(clubId);
    const event = findEvent(eventId);
    const member = findMember(input.memberId);

    if (isAttendanceStatus(input.status)) {
      eventAttendance[eventId] ??= {};
      eventAttendance[eventId][member.id] = {
        status: input.status,
        companionCount: Number(input.companionCount) || 0,
      };
    }

    persistStore();
    return buildEventItem(event, clubId);
  }

  getEvents(clubId: string) {
    ensureClub(clubId);
    return buildEvents(clubId);
  }

  createEvent(clubId: string, input: CreateAdminEventInput) {
    ensureClub(clubId);
    const nextEvent: AdminEventListItem = {
      id: `event-${Date.now()}`,
      title: input.title.trim(),
      startsAt: input.startsAt,
      locationName: input.locationName.trim(),
      locationAddress: input.locationAddress?.trim(),
      responseDeadline: input.responseDeadline,
      visibility: isResourceVisibility(input.visibility) ? input.visibility : "all_members",
      attendingCount: 0,
      notAttendingCount: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      attendanceRate: 0,
      attendanceConversionRate: 0,
      participants: [],
    };

    events.unshift(nextEvent);
    ensureEventTargets(nextEvent.id, clubId);
    persistStore();
    return buildEventItem(nextEvent, clubId);
  }

  updateEvent(clubId: string, eventId: string, input: UpdateAdminEventInput) {
    ensureClub(clubId);
    const event = findEvent(eventId);

    if (typeof input.title === "string" && input.title.trim()) {
      event.title = input.title.trim();
    }

    if (typeof input.startsAt === "string" && input.startsAt.trim()) {
      event.startsAt = input.startsAt;
    }

    if (typeof input.locationName === "string" && input.locationName.trim()) {
      event.locationName = input.locationName.trim();
    }

    if (typeof input.locationAddress === "string") {
      event.locationAddress = input.locationAddress.trim() || undefined;
    }

    if (typeof input.responseDeadline === "string") {
      event.responseDeadline = input.responseDeadline.trim() || undefined;
    }

    if (isResourceVisibility(input.visibility)) {
      event.visibility = input.visibility;
    }

    persistStore();
    return buildEventItem(event, clubId);
  }

  deleteEvent(clubId: string, eventId: string) {
    ensureClub(clubId);
    const eventIndex = events.findIndex((item) => item.id === eventId);

    if (eventIndex < 0) {
      throw new NotFoundException("Event not found");
    }

    events.splice(eventIndex, 1);
    delete eventResponses[eventId];
    delete eventAttendance[eventId];
    persistStore();
    return { id: eventId, deleted: true as const };
  }

  updateEventResponse(clubId: string, eventId: string, input: UpdateAdminEventResponseInput) {
    ensureClub(clubId);
    const event = findEvent(eventId);
    const member = findMember(input.memberId);

    if (isEventResponse(input.response)) {
      eventResponses[eventId] ??= {};
      eventResponses[eventId][member.id] = input.response;
    }

    persistStore();
    return buildEventItem(event, clubId);
  }

  getNotices(clubId: string) {
    ensureClub(clubId);
    return buildNotices(clubId);
  }

  createNotice(clubId: string, input: CreateAdminNoticeInput) {
    ensureClub(clubId);
    const nextNotice: AdminNoticeListItem = {
      id: `notice-${Date.now()}`,
      title: input.title.trim(),
      body: input.body.trim(),
      visibility: isResourceVisibility(input.visibility) ? input.visibility : "all_members",
      createdAt: new Date().toISOString(),
      readCount: 0,
      unreadCount: 0,
      likeCount: 0,
      commentCount: 0,
      readers: [],
      comments: [],
    };

    notices.unshift(nextNotice);
    noticeReads[nextNotice.id] = new Set();
    noticeLikes[nextNotice.id] = new Set();
    noticeComments[nextNotice.id] = [];
    persistStore();
    return buildNoticeItem(nextNotice, clubId);
  }

  updateNotice(clubId: string, noticeId: string, input: UpdateAdminNoticeInput) {
    ensureClub(clubId);
    const notice = findNotice(noticeId);

    if (typeof input.title === "string" && input.title.trim()) {
      notice.title = input.title.trim();
    }

    if (typeof input.body === "string" && input.body.trim()) {
      notice.body = input.body.trim();
    }

    if (isResourceVisibility(input.visibility)) {
      notice.visibility = input.visibility;
    }

    persistStore();
    return buildNoticeItem(notice, clubId);
  }

  deleteNotice(clubId: string, noticeId: string) {
    ensureClub(clubId);
    const noticeIndex = notices.findIndex((item) => item.id === noticeId);

    if (noticeIndex < 0) {
      throw new NotFoundException("Notice not found");
    }

    notices.splice(noticeIndex, 1);
    delete noticeReads[noticeId];
    delete noticeLikes[noticeId];
    delete noticeComments[noticeId];
    persistStore();
    return { id: noticeId, deleted: true as const };
  }

  markNoticeRead(clubId: string, noticeId: string, input: UpdateAdminNoticeReadInput) {
    ensureClub(clubId);
    const notice = findNotice(noticeId);
    const member = findMember(input.memberId);
    noticeReads[noticeId] ??= new Set();
    noticeReads[noticeId].add(member.id);
    persistStore();
    return buildNoticeItem(notice, clubId);
  }

  toggleNoticeReaction(clubId: string, noticeId: string, input: ToggleAdminNoticeReactionInput) {
    ensureClub(clubId);
    const notice = findNotice(noticeId);
    const member = findMember(input.memberId);
    noticeLikes[noticeId] ??= new Set();

    if (noticeLikes[noticeId].has(member.id)) {
      noticeLikes[noticeId].delete(member.id);
    } else {
      noticeLikes[noticeId].add(member.id);
    }

    persistStore();
    return buildNoticeItem(notice, clubId);
  }

  createNoticeComment(clubId: string, noticeId: string, input: CreateAdminNoticeCommentInput) {
    ensureClub(clubId);
    const notice = findNotice(noticeId);
    const member = findMember(input.memberId);
    const comment: AdminNoticeCommentListItem = {
      id: `comment-${Date.now()}`,
      memberName: member.name,
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
    };

    noticeComments[noticeId] ??= [];
    noticeComments[noticeId].push(comment);
    persistStore();
    return buildNoticeItem(notice, clubId);
  }

  async createFeedback(input: CreateFeedbackInput): Promise<FeedbackResult> {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO ?? "jaywapp/Crewith";

    if (!token) {
      throw new BadRequestException("GitHub integration is not configured");
    }

    const categoryLabel = { bug: "버그", improvement: "개선 제안", other: "기타" }[input.category] ?? input.category;
    const issueBody = [
      `**카테고리**: ${categoryLabel}`,
      "",
      input.body,
      ...(input.memberId ? ["", "---", `_제출자 ID: ${input.memberId}_`] : []),
    ].join("\n");

    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        title: `[피드백] ${input.title}`,
        body: issueBody,
        labels: ["feedback", "pending-ai"],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`GitHub API ${res.status}: ${err}`);
    }

    const data = (await res.json()) as { number: number; html_url: string };
    return { issueNumber: data.number, issueUrl: data.html_url };
  }
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AcceptInviteInput,
  type AdminEventListItem,
  type AdminFeeListItem,
  type AdminInviteLinkListItem,
  type AdminJoinRequestListItem,
  type AdminMemberListItem,
  type AdminNoticeCommentListItem,
  type AdminNoticeListItem,
  type AdminNotificationLogItem,
  type MemberNotificationItem,
  type AuthOtpRequestInput,
  type AuthOtpVerifyInput,
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
  type RegisterDeviceInput,
  type ReviewJoinRequestInput,
  type SendReminderInput,
  type ToggleAdminNoticeReactionInput,
  type UpdateAdminAttendanceInput,
  type UpdateAdminEventResponseInput,
  type UpdateAdminFeePaymentInput,
  type UpdateAdminMemberInput,
  type UpdateAdminNoticeReadInput,
  type UpdateMemberProfileInput,
  buildEventItem,
  buildFeeItem,
  buildFees,
  buildEvents,
  buildMemberAppOverview,
  buildNoticeItem,
  buildNotices,
  buildOverview,
  buildProfile,
  buildReminderTargets,
  clubMemberships,
  clubMembershipSummaries,
  createMemberFromProfile,
  ensureClub,
  ensureEventTargets,
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
  otpCodes,
  persistStore,
  profileImages,
  registerMemberDevice,
  visibleMembers,
} from "./mvp.store";

export abstract class MvpRepository {
  abstract getAdminOverview(clubId: string): ReturnType<typeof buildOverview>;
  abstract requestOtp(input: AuthOtpRequestInput): {
    data: { phoneNumber: string; code: string; expiresAt: string };
    meta: { mode: "development" };
  };
  abstract verifyOtp(input: AuthOtpVerifyInput): unknown;
  abstract registerDevice(input: RegisterDeviceInput): ReturnType<typeof registerMemberDevice>;
  abstract getMemberProfile(memberId: string): ReturnType<typeof buildProfile>;
  abstract updateMemberProfile(memberId: string, input: UpdateMemberProfileInput): ReturnType<typeof buildProfile>;
  abstract getMemberAppOverview(clubId: string, memberId: string): ReturnType<typeof buildMemberAppOverview>;
  abstract getMemberNotifications(memberId: string): MemberNotificationItem[];
  abstract markMemberNotificationRead(memberId: string, notificationId: string): MemberNotificationItem;
  abstract getReminderTargets(clubId: string): ReturnType<typeof buildReminderTargets>;
  abstract sendReminder(clubId: string, input: SendReminderInput): AdminNotificationLogItem;
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
  abstract updateEventResponse(clubId: string, eventId: string, input: UpdateAdminEventResponseInput): AdminEventListItem;
  abstract getNotices(clubId: string): AdminNoticeListItem[];
  abstract createNotice(clubId: string, input: CreateAdminNoticeInput): AdminNoticeListItem;
  abstract markNoticeRead(clubId: string, noticeId: string, input: UpdateAdminNoticeReadInput): AdminNoticeListItem;
  abstract toggleNoticeReaction(clubId: string, noticeId: string, input: ToggleAdminNoticeReactionInput): AdminNoticeListItem;
  abstract createNoticeComment(clubId: string, noticeId: string, input: CreateAdminNoticeCommentInput): AdminNoticeListItem;
}

@Injectable()
export class JsonMvpRepository implements MvpRepository {
  getAdminOverview(clubId: string) {
    return buildOverview(clubId);
  }

  requestOtp(input: AuthOtpRequestInput) {
    const phoneNumber = normalizePhoneNumber(input.phoneNumber ?? "");

    if (!phoneNumber) {
      throw new BadRequestException("Phone number is required");
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const code = "123456";
    otpCodes.set(phoneNumber, { code, expiresAt });

    return {
      data: {
        phoneNumber,
        code,
        expiresAt,
      },
      meta: {
        mode: "development" as const,
      },
    };
  }

  verifyOtp(input: AuthOtpVerifyInput) {
    const phoneNumber = normalizePhoneNumber(input.phoneNumber ?? "");
    const code = `${input.code ?? ""}`.trim();
    const otp = otpCodes.get(phoneNumber);

    if (!otp || otp.code !== code || Date.parse(otp.expiresAt) < Date.now()) {
      throw new BadRequestException("Invalid or expired OTP code");
    }

    otpCodes.delete(phoneNumber);

    let member = members.find(
      (item) => normalizePhoneNumber(item.phoneNumber) === phoneNumber && item.memberStatus !== "removed",
    );

    if (!member) {
      member = createMemberFromProfile(`회원 ${phoneNumber.slice(-4)}`, phoneNumber);
      persistStore();
    }

    return {
      token: `dev-token-${member.id}`,
      memberId: member.id,
      profile: buildProfile(member),
      clubs: clubMembershipSummaries(member.id),
    };
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
        if (clubId !== "club-seoul-runners") {
          clubMemberships.push({
            clubId,
            memberId: member.id,
            role: "member",
            memberStatus: "active",
            joinedAt: member.joinedAt,
          });
        }
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

    const member: AdminMemberListItem = {
      id: `member-${Date.now()}`,
      name: input.applicantName.trim(),
      phoneNumber: input.applicantPhone.trim(),
      role: "member",
      memberStatus: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
      lastFeeStatus: "unpaid",
      attendanceRate: 0,
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
    const nextMember: AdminMemberListItem = {
      id: `member-${Date.now()}`,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
      role: isClubRole(input.role) ? input.role : "member",
      memberStatus: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
      lastFeeStatus: "unpaid",
      attendanceRate: 0,
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
      const [name, phoneNumber, roleValue] = columns;

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
      member.memberStatus = input.memberStatus;
      if (membership) {
        membership.memberStatus = input.memberStatus;
      }
    }

    if (isFeePaymentStatus(input.lastFeeStatus)) {
      member.lastFeeStatus = input.lastFeeStatus;
      feePayments[fees[0].id][member.id] = input.lastFeeStatus;
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
    member.memberStatus = "removed";
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
}

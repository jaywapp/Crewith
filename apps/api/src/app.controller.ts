import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  type AcceptInviteInput,
  type AuthOtpRequestInput,
  type AuthOtpVerifyInput,
  type AdminEventListItem,
  type AdminFeeListItem,
  type AdminInviteLinkListItem,
  type AdminJoinRequestListItem,
  type AdminMemberListItem,
  type AdminNoticeCommentListItem,
  type AdminNoticeListItem,
  type AdminNotificationLogItem,
  type CreateAdminEventInput,
  type CreateAdminFeeInput,
  type CreateAdminMemberInput,
  type CreateAdminNoticeCommentInput,
  type CreateAdminNoticeInput,
  type CreateInviteLinkInput,
  type CreateJoinRequestInput,
  type FeePaymentStatus,
  type ReviewJoinRequestInput,
  type SendReminderInput,
  type ToggleAdminNoticeReactionInput,
  type UpdateAdminAttendanceInput,
  type UpdateAdminEventResponseInput,
  type UpdateAdminFeePaymentInput,
  type UpdateAdminMemberInput,
  type UpdateAdminNoticeReadInput,
  type UpdateMemberProfileInput,
  activeMembers,
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
  club,
  createMemberFromProfile,
  ensureEventTargets,
  ensureFeeTargets,
  eventAttendance,
  eventResponses,
  events,
  fees,
  feePayments,
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
  visibleMembers,
} from "./mvp.store";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return {
      data: {
        status: "ok",
        service: "crewith-api",
        checkedAt: new Date().toISOString(),
      },
    };
  }

  @Get("clubs/:clubId/admin/overview")
  getAdminOverview(@Param("clubId") clubId: string) {
    return {
      data: {
        ...buildOverview(),
        club: {
          ...club,
          id: clubId,
        },
      },
    };
  }

  @Post("auth/otp/request")
  requestOtp(@Body() input: AuthOtpRequestInput) {
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
        mode: "development",
      },
    };
  }

  @Post("auth/otp/verify")
  verifyOtp(@Body() input: AuthOtpVerifyInput) {
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
      data: {
        token: `dev-token-${member.id}`,
        memberId: member.id,
        profile: buildProfile(member),
        clubs: [
          {
            clubId: club.id,
            name: club.name,
            sportType: club.sportType,
            role: member.role,
            memberStatus: member.memberStatus,
          },
        ],
      },
    };
  }

  @Get("members/:memberId/profile")
  getMemberProfile(@Param("memberId") memberId: string) {
    return {
      data: buildProfile(findMember(memberId)),
    };
  }

  @Patch("members/:memberId/profile")
  updateMemberProfile(
    @Param("memberId") memberId: string,
    @Body() input: UpdateMemberProfileInput,
  ) {
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

    return {
      data: buildProfile(member),
    };
  }

  @Get("clubs/:clubId/member-app/:memberId")
  getMemberAppOverview(@Param("memberId") memberId: string) {
    return {
      data: buildMemberAppOverview(memberId),
    };
  }

  @Get("clubs/:clubId/reminders")
  getReminderTargets() {
    return {
      data: buildReminderTargets(),
    };
  }

  @Post("clubs/:clubId/reminders/send")
  sendReminder(@Body() input: SendReminderInput) {
    const reminder = buildReminderTargets().find((item) => item.id === input.reminderId);

    if (!reminder) {
      throw new NotFoundException("Reminder target not found");
    }

    const log: AdminNotificationLogItem = {
      id: `notification-${Date.now()}`,
      type: reminder.type,
      title: reminder.title,
      targetCount: reminder.targetCount,
      sentAt: new Date().toISOString(),
      channel: "app_push",
    };

    notificationLogs.unshift(log);
    persistStore();

    return {
      data: log,
    };
  }

  @Get("clubs/:clubId/members")
  getMembers() {
    return {
      data: visibleMembers(),
    };
  }

  @Get("clubs/:clubId/join-requests")
  getJoinRequests() {
    return {
      data: joinRequests,
    };
  }

  @Post("clubs/:clubId/join-requests")
  createJoinRequest(@Body() input: CreateJoinRequestInput) {
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

    return {
      data: nextRequest,
    };
  }

  @Patch("clubs/:clubId/join-requests/:requestId")
  reviewJoinRequest(
    @Param("requestId") requestId: string,
    @Body() input: ReviewJoinRequestInput,
  ) {
    const request = findJoinRequest(requestId);

    if (input.status === "approved" || input.status === "rejected") {
      request.status = input.status;
    }

    if (request.status === "approved") {
      const exists = members.some((member) => member.phoneNumber === request.applicantPhone);
      if (!exists) {
        createMemberFromProfile(request.applicantName, request.applicantPhone);
      }
    }

    persistStore();

    return {
      data: request,
    };
  }

  @Get("clubs/:clubId/invite-links")
  getInviteLinks() {
    return {
      data: inviteLinks,
    };
  }

  @Post("clubs/:clubId/invite-links")
  createInviteLink(@Body() input: CreateInviteLinkInput) {
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

    return {
      data: nextInvite,
    };
  }

  @Post("clubs/:clubId/invite-links/:token/accept")
  acceptInvite(
    @Param("token") token: string,
    @Body() input: AcceptInviteInput,
  ) {
    findInviteByToken(token);

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
    initializeMemberState(member);
    persistStore();

    return {
      data: member,
    };
  }

  @Post("clubs/:clubId/members")
  createMember(@Body() input: CreateAdminMemberInput) {
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
    initializeMemberState(nextMember);
    persistStore();

    return {
      data: nextMember,
    };
  }

  @Patch("clubs/:clubId/members/:memberId")
  updateMember(
    @Param("memberId") memberId: string,
    @Body() input: UpdateAdminMemberInput,
  ) {
    const member = findMember(memberId);

    if (typeof input.name === "string" && input.name.trim()) {
      member.name = input.name.trim();
    }

    if (typeof input.phoneNumber === "string" && input.phoneNumber.trim()) {
      member.phoneNumber = input.phoneNumber.trim();
    }

    if (isClubRole(input.role)) {
      member.role = input.role;
    }

    if (isMemberStatus(input.memberStatus)) {
      member.memberStatus = input.memberStatus;
    }

    if (isFeePaymentStatus(input.lastFeeStatus)) {
      member.lastFeeStatus = input.lastFeeStatus;
      feePayments[fees[0].id][member.id] = input.lastFeeStatus;
    }

    persistStore();

    return {
      data: member,
    };
  }

  @Patch("clubs/:clubId/members/:memberId/fee-status")
  updateMemberFeeStatus(
    @Param("memberId") memberId: string,
    @Body("status") status: FeePaymentStatus,
  ) {
    const member = findMember(memberId);

    if (isFeePaymentStatus(status)) {
      member.lastFeeStatus = status;
    }

    persistStore();

    return {
      data: member,
    };
  }

  @Delete("clubs/:clubId/members/:memberId")
  removeMember(@Param("memberId") memberId: string) {
    const member = findMember(memberId);
    member.memberStatus = "removed";
    persistStore();

    return {
      data: member,
    };
  }

  @Get("clubs/:clubId/fees")
  getFees() {
    return {
      data: buildFees(),
    };
  }

  @Post("clubs/:clubId/fees")
  createFee(@Body() input: CreateAdminFeeInput) {
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
    ensureFeeTargets(nextFee.id);
    persistStore();

    return {
      data: buildFeeItem(nextFee),
    };
  }

  @Patch("clubs/:clubId/fees/:feeId/payments")
  updateFeePayment(
    @Param("feeId") feeId: string,
    @Body() input: UpdateAdminFeePaymentInput,
  ) {
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

    return {
      data: buildFeeItem(fee),
    };
  }

  @Patch("clubs/:clubId/events/:eventId/attendance")
  updateEventAttendance(
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminAttendanceInput,
  ) {
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

    return {
      data: buildEventItem(event),
    };
  }

  @Get("clubs/:clubId/events")
  getEvents() {
    return {
      data: buildEvents(),
    };
  }

  @Post("clubs/:clubId/events")
  createEvent(@Body() input: CreateAdminEventInput) {
    const nextEvent: AdminEventListItem = {
      id: `event-${Date.now()}`,
      title: input.title.trim(),
      startsAt: input.startsAt,
      locationName: input.locationName.trim(),
      locationAddress: input.locationAddress?.trim(),
      responseDeadline: input.responseDeadline,
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
    ensureEventTargets(nextEvent.id);
    persistStore();

    return {
      data: buildEventItem(nextEvent),
    };
  }

  @Patch("clubs/:clubId/events/:eventId/responses")
  updateEventResponse(
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminEventResponseInput,
  ) {
    const event = findEvent(eventId);
    const member = findMember(input.memberId);

    if (isEventResponse(input.response)) {
      eventResponses[eventId] ??= {};
      eventResponses[eventId][member.id] = input.response;
    }

    persistStore();

    return {
      data: buildEventItem(event),
    };
  }

  @Get("clubs/:clubId/notices")
  getNotices() {
    return {
      data: buildNotices(),
    };
  }

  @Post("clubs/:clubId/notices")
  createNotice(@Body() input: CreateAdminNoticeInput) {
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

    return {
      data: buildNoticeItem(nextNotice),
    };
  }

  @Patch("clubs/:clubId/notices/:noticeId/read")
  markNoticeRead(
    @Param("noticeId") noticeId: string,
    @Body() input: UpdateAdminNoticeReadInput,
  ) {
    const notice = findNotice(noticeId);
    const member = findMember(input.memberId);
    noticeReads[noticeId] ??= new Set();
    noticeReads[noticeId].add(member.id);
    persistStore();

    return {
      data: buildNoticeItem(notice),
    };
  }

  @Patch("clubs/:clubId/notices/:noticeId/reactions")
  toggleNoticeReaction(
    @Param("noticeId") noticeId: string,
    @Body() input: ToggleAdminNoticeReactionInput,
  ) {
    const notice = findNotice(noticeId);
    const member = findMember(input.memberId);
    noticeLikes[noticeId] ??= new Set();

    if (noticeLikes[noticeId].has(member.id)) {
      noticeLikes[noticeId].delete(member.id);
    } else {
      noticeLikes[noticeId].add(member.id);
    }

    persistStore();

    return {
      data: buildNoticeItem(notice),
    };
  }

  @Post("clubs/:clubId/notices/:noticeId/comments")
  createNoticeComment(
    @Param("noticeId") noticeId: string,
    @Body() input: CreateAdminNoticeCommentInput,
  ) {
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

    return {
      data: buildNoticeItem(notice),
    };
  }
}

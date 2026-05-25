import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  type AcceptInviteInput,
  type AuthLoginInput,
  type CreateAdminEventInput,
  type CreateAdminFeeInput,
  type CreateAdminMemberInput,
  type CreateAdminNoticeCommentInput,
  type CreateAdminNoticeInput,
  type CreateInviteLinkInput,
  type CreateJoinRequestInput,
  type FeePaymentStatus,
  type ImportAdminMembersInput,
  type RegisterDeviceInput,
  type ResetMemberPasswordInput,
  type ReviewJoinRequestInput,
  type SendReminderInput,
  type ToggleAdminNoticeReactionInput,
  type UpdateAdminAttendanceInput,
  type UpdateAdminEventInput,
  type UpdateAdminEventResponseInput,
  type UpdateAdminFeePaymentInput,
  type UpdateClubFeeSettingsInput,
  type UpdateClubNotificationSettingsInput,
  type UpdateClubPrivacySettingsInput,
  type UpdateAdminMemberInput,
  type UpdateAdminNoticeReadInput,
  type UpdateAdminNoticeInput,
  type UpdateMemberProfileInput,
  type CreateFeedbackInput,
  type RegisterInput,
} from "./mvp.store";
import { MvpRepository } from "./mvp.repository";

function assertOperatorRole(role: string | undefined) {
  if (role !== "owner" && role !== "operator") {
    throw new ForbiddenException("Operator role is required");
  }
}

@Controller()
export class AppController {
  constructor(private readonly repository: MvpRepository) {}

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
  getAdminOverview(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getAdminOverview(clubId) };
  }

  @Post("auth/login")
  login(@Body() input: AuthLoginInput) {
    return { data: this.repository.login(input) };
  }

  @Post("auth/register")
  register(@Body() input: RegisterInput) {
    return { data: this.repository.register(input) };
  }

  @Post("me/devices")
  registerDevice(@Body() input: RegisterDeviceInput) {
    return { data: this.repository.registerDevice(input) };
  }

  @Get("members/:memberId/profile")
  getMemberProfile(@Param("memberId") memberId: string) {
    return { data: this.repository.getMemberProfile(memberId) };
  }

  @Patch("members/:memberId/profile")
  updateMemberProfile(
    @Param("memberId") memberId: string,
    @Body() input: UpdateMemberProfileInput,
  ) {
    return { data: this.repository.updateMemberProfile(memberId, input) };
  }

  @Get("clubs/:clubId/member-app/:memberId")
  getMemberAppOverview(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
  ) {
    return { data: this.repository.getMemberAppOverview(clubId, memberId) };
  }

  @Get("clubs/:clubId/member-app/:memberId/members")
  getMemberDirectory(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
  ) {
    return { data: this.repository.getMemberDirectory(clubId, memberId) };
  }

  @Get("me/notifications")
  getMemberNotifications(@Query("memberId") memberId: string) {
    return { data: this.repository.getMemberNotifications(memberId) };
  }

  @Patch("me/notifications/:notificationId/read")
  markMemberNotificationRead(
    @Param("notificationId") notificationId: string,
    @Body("memberId") memberId: string,
  ) {
    return { data: this.repository.markMemberNotificationRead(memberId, notificationId) };
  }

  @Get("clubs/:clubId/reminders")
  getReminderTargets(@Param("clubId") clubId: string) {
    return { data: this.repository.getReminderTargets(clubId) };
  }

  @Get("clubs/:clubId/fee-settings")
  getFeeSettings(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getFeeSettings(clubId) };
  }

  @Put("clubs/:clubId/fee-settings")
  updateFeeSettings(
    @Param("clubId") clubId: string,
    @Body() input: UpdateClubFeeSettingsInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateFeeSettings(clubId, input) };
  }

  @Get("clubs/:clubId/notification-settings")
  getNotificationSettings(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getNotificationSettings(clubId) };
  }

  @Put("clubs/:clubId/notification-settings")
  updateNotificationSettings(
    @Param("clubId") clubId: string,
    @Body() input: UpdateClubNotificationSettingsInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateNotificationSettings(clubId, input) };
  }

  @Get("clubs/:clubId/privacy-settings")
  getPrivacySettings(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getPrivacySettings(clubId) };
  }

  @Put("clubs/:clubId/privacy-settings")
  updatePrivacySettings(
    @Param("clubId") clubId: string,
    @Body() input: UpdateClubPrivacySettingsInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updatePrivacySettings(clubId, input) };
  }

  @Post("clubs/:clubId/reminders/send")
  sendReminder(
    @Param("clubId") clubId: string,
    @Body() input: SendReminderInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.sendReminder(clubId, input) };
  }

  @Get("clubs/:clubId/members")
  getMembers(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getMembers(clubId) };
  }

  @Get("clubs/:clubId/join-requests")
  getJoinRequests(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getJoinRequests(clubId) };
  }

  @Post("clubs/:clubId/join-requests")
  createJoinRequest(
    @Param("clubId") clubId: string,
    @Body() input: CreateJoinRequestInput,
  ) {
    return { data: this.repository.createJoinRequest(clubId, input) };
  }

  @Patch("clubs/:clubId/join-requests/:requestId")
  reviewJoinRequest(
    @Param("clubId") clubId: string,
    @Param("requestId") requestId: string,
    @Body() input: ReviewJoinRequestInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.reviewJoinRequest(clubId, requestId, input) };
  }

  @Get("clubs/:clubId/invite-links")
  getInviteLinks(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getInviteLinks(clubId) };
  }

  @Post("clubs/:clubId/invite-links")
  createInviteLink(
    @Param("clubId") clubId: string,
    @Body() input: CreateInviteLinkInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createInviteLink(clubId, input) };
  }

  @Patch("clubs/:clubId/invite-links/:inviteId/disable")
  disableInviteLink(
    @Param("clubId") clubId: string,
    @Param("inviteId") inviteId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.disableInviteLink(clubId, inviteId) };
  }

  @Post("clubs/:clubId/invite-links/:token/accept")
  acceptInvite(
    @Param("clubId") clubId: string,
    @Param("token") token: string,
    @Body() input: AcceptInviteInput,
  ) {
    return { data: this.repository.acceptInvite(clubId, token, input) };
  }

  @Post("clubs/:clubId/members")
  createMember(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminMemberInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createMember(clubId, input) };
  }

  @Post("clubs/:clubId/members/imports")
  importMembers(
    @Param("clubId") clubId: string,
    @Body() input: ImportAdminMembersInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.importMembers(clubId, input) };
  }

  @Patch("clubs/:clubId/members/:memberId")
  updateMember(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
    @Body() input: UpdateAdminMemberInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateMember(clubId, memberId, input) };
  }

  @Patch("clubs/:clubId/members/:memberId/fee-status")
  updateMemberFeeStatus(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
    @Body("status") status: FeePaymentStatus,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateMemberFeeStatus(clubId, memberId, status) };
  }

  @Patch("clubs/:clubId/members/:memberId/password")
  resetMemberPassword(
    @Param("memberId") memberId: string,
    @Body() input: ResetMemberPasswordInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.resetMemberPassword(memberId, input) };
  }

  @Delete("clubs/:clubId/members/:memberId")
  removeMember(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.removeMember(clubId, memberId) };
  }

  @Get("clubs/:clubId/fees")
  getFees(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getFees(clubId) };
  }

  @Post("clubs/:clubId/fees")
  createFee(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminFeeInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createFee(clubId, input) };
  }

  @Patch("clubs/:clubId/fees/:feeId/payments")
  updateFeePayment(
    @Param("clubId") clubId: string,
    @Param("feeId") feeId: string,
    @Body() input: UpdateAdminFeePaymentInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateFeePayment(clubId, feeId, input) };
  }

  @Patch("clubs/:clubId/events/:eventId/attendance")
  updateEventAttendance(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminAttendanceInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateEventAttendance(clubId, eventId, input) };
  }

  @Get("clubs/:clubId/events")
  getEvents(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getEvents(clubId) };
  }

  @Post("clubs/:clubId/events")
  createEvent(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminEventInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createEvent(clubId, input) };
  }

  @Patch("clubs/:clubId/events/:eventId")
  updateEvent(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminEventInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateEvent(clubId, eventId, input) };
  }

  @Delete("clubs/:clubId/events/:eventId")
  deleteEvent(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.deleteEvent(clubId, eventId) };
  }

  @Patch("clubs/:clubId/events/:eventId/responses")
  updateEventResponse(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminEventResponseInput,
  ) {
    return { data: this.repository.updateEventResponse(clubId, eventId, input) };
  }

  @Get("clubs/:clubId/notices")
  getNotices(
    @Param("clubId") clubId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.getNotices(clubId) };
  }

  @Post("clubs/:clubId/notices")
  createNotice(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminNoticeInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createNotice(clubId, input) };
  }

  @Patch("clubs/:clubId/notices/:noticeId")
  updateNotice(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: UpdateAdminNoticeInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateNotice(clubId, noticeId, input) };
  }

  @Delete("clubs/:clubId/notices/:noticeId")
  deleteNotice(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.deleteNotice(clubId, noticeId) };
  }

  @Patch("clubs/:clubId/notices/:noticeId/read")
  markNoticeRead(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: UpdateAdminNoticeReadInput,
  ) {
    return { data: this.repository.markNoticeRead(clubId, noticeId, input) };
  }

  @Patch("clubs/:clubId/notices/:noticeId/reactions")
  toggleNoticeReaction(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: ToggleAdminNoticeReactionInput,
  ) {
    return { data: this.repository.toggleNoticeReaction(clubId, noticeId, input) };
  }

  @Post("feedback")
  createFeedback(@Body() input: CreateFeedbackInput) {
    return this.repository.createFeedback(input);
  }

  @Post("clubs/:clubId/notices/:noticeId/comments")
  createNoticeComment(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: CreateAdminNoticeCommentInput,
  ) {
    return { data: this.repository.createNoticeComment(clubId, noticeId, input) };
  }
}

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { CurrentUser, type CurrentUserPayload } from "./auth/current-user";
import { Public } from "./auth/public.decorator";
import { RequireClubRole } from "./auth/require-club-role.decorator";
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
  type UpdateAdminFeeInput,
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
  type CreateClubInput,
  type SelfResetPasswordInput,
} from "./mvp.store";
import { MvpRepository } from "./mvp.repository";

function assertSelf(user: CurrentUserPayload | undefined, memberId: string | undefined) {
  if (!user || !memberId || user.sub !== memberId) {
    throw new ForbiddenException("본인 계정으로만 접근할 수 있습니다.");
  }
}

@Controller()
export class AppController {
  constructor(
    private readonly repository: MvpRepository,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
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

  @RequireClubRole()
  @Get("clubs/:clubId/admin/overview")
  getAdminOverview(@Param("clubId") clubId: string) {
    return { data: this.repository.getAdminOverview(clubId) };
  }

  @Public()
  @Post("auth/login")
  async login(@Body() input: AuthLoginInput) {
    const session = await this.repository.login(input);
    const accessToken = await this.jwtService.signAsync({
      sub: session.memberId,
      phoneNumber: session.profile.phoneNumber,
    });
    return { data: { ...session, accessToken } };
  }

  @Public()
  @Post("auth/register")
  register(@Body() input: RegisterInput) {
    return { data: this.repository.register(input) };
  }

  @Public()
  @Post("auth/reset-password")
  selfResetPassword(@Body() input: SelfResetPasswordInput) {
    return { data: this.repository.selfResetPassword(input) };
  }

  @Post("clubs")
  createClub(
    @Body() input: CreateClubInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    if (!user) {
      throw new ForbiddenException("본인 계정으로만 접근할 수 있습니다.");
    }
    if (input.ownerMemberId && input.ownerMemberId !== user.sub) {
      throw new ForbiddenException("본인 계정으로만 모임을 만들 수 있습니다.");
    }
    return { data: this.repository.createClub({ ...input, ownerMemberId: user.sub }) };
  }

  @Post("me/devices")
  registerDevice(
    @Body() input: RegisterDeviceInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, input.memberId);
    return { data: this.repository.registerDevice(input) };
  }

  @Get("members/:memberId/profile")
  getMemberProfile(
    @Param("memberId") memberId: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, memberId);
    return { data: this.repository.getMemberProfile(memberId) };
  }

  @Patch("members/:memberId/profile")
  updateMemberProfile(
    @Param("memberId") memberId: string,
    @Body() input: UpdateMemberProfileInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, memberId);
    return { data: this.repository.updateMemberProfile(memberId, input) };
  }

  @Get("clubs/:clubId/member-app/:memberId")
  getMemberAppOverview(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, memberId);
    return { data: this.repository.getMemberAppOverview(clubId, memberId) };
  }

  @Get("clubs/:clubId/member-app/:memberId/members")
  getMemberDirectory(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, memberId);
    return { data: this.repository.getMemberDirectory(clubId, memberId) };
  }

  @Get("me/notifications")
  getMemberNotifications(
    @Query("memberId") memberId: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, memberId);
    return { data: this.repository.getMemberNotifications(memberId) };
  }

  @Patch("me/notifications/:notificationId/read")
  markMemberNotificationRead(
    @Param("notificationId") notificationId: string,
    @Body("memberId") memberId: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, memberId);
    return { data: this.repository.markMemberNotificationRead(memberId, notificationId) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/reminders")
  getReminderTargets(@Param("clubId") clubId: string) {
    return { data: this.repository.getReminderTargets(clubId) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/fee-settings")
  getFeeSettings(@Param("clubId") clubId: string) {
    return { data: this.repository.getFeeSettings(clubId) };
  }

  @RequireClubRole()
  @Put("clubs/:clubId/fee-settings")
  updateFeeSettings(
    @Param("clubId") clubId: string,
    @Body() input: UpdateClubFeeSettingsInput,
  ) {
    return { data: this.repository.updateFeeSettings(clubId, input) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/notification-settings")
  getNotificationSettings(@Param("clubId") clubId: string) {
    return { data: this.repository.getNotificationSettings(clubId) };
  }

  @RequireClubRole()
  @Put("clubs/:clubId/notification-settings")
  updateNotificationSettings(
    @Param("clubId") clubId: string,
    @Body() input: UpdateClubNotificationSettingsInput,
  ) {
    return { data: this.repository.updateNotificationSettings(clubId, input) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/privacy-settings")
  getPrivacySettings(@Param("clubId") clubId: string) {
    return { data: this.repository.getPrivacySettings(clubId) };
  }

  @RequireClubRole()
  @Put("clubs/:clubId/privacy-settings")
  updatePrivacySettings(
    @Param("clubId") clubId: string,
    @Body() input: UpdateClubPrivacySettingsInput,
  ) {
    return { data: this.repository.updatePrivacySettings(clubId, input) };
  }

  @RequireClubRole()
  @Post("clubs/:clubId/reminders/send")
  sendReminder(
    @Param("clubId") clubId: string,
    @Body() input: SendReminderInput,
  ) {
    return { data: this.repository.sendReminder(clubId, input) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/members")
  getMembers(@Param("clubId") clubId: string) {
    return { data: this.repository.getMembers(clubId) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/join-requests")
  getJoinRequests(@Param("clubId") clubId: string) {
    return { data: this.repository.getJoinRequests(clubId) };
  }

  @Public()
  @Post("clubs/:clubId/join-requests")
  createJoinRequest(
    @Param("clubId") clubId: string,
    @Body() input: CreateJoinRequestInput,
  ) {
    return { data: this.repository.createJoinRequest(clubId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/join-requests/:requestId")
  reviewJoinRequest(
    @Param("clubId") clubId: string,
    @Param("requestId") requestId: string,
    @Body() input: ReviewJoinRequestInput,
  ) {
    return { data: this.repository.reviewJoinRequest(clubId, requestId, input) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/invite-links")
  getInviteLinks(@Param("clubId") clubId: string) {
    return { data: this.repository.getInviteLinks(clubId) };
  }

  @RequireClubRole()
  @Post("clubs/:clubId/invite-links")
  createInviteLink(
    @Param("clubId") clubId: string,
    @Body() input: CreateInviteLinkInput,
  ) {
    return { data: this.repository.createInviteLink(clubId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/invite-links/:inviteId/disable")
  disableInviteLink(
    @Param("clubId") clubId: string,
    @Param("inviteId") inviteId: string,
  ) {
    return { data: this.repository.disableInviteLink(clubId, inviteId) };
  }

  @Public()
  @Post("clubs/:clubId/invite-links/:token/accept")
  acceptInvite(
    @Param("clubId") clubId: string,
    @Param("token") token: string,
    @Body() input: AcceptInviteInput,
  ) {
    return { data: this.repository.acceptInvite(clubId, token, input) };
  }

  @RequireClubRole()
  @Post("clubs/:clubId/members")
  createMember(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminMemberInput,
  ) {
    return { data: this.repository.createMember(clubId, input) };
  }

  @RequireClubRole()
  @Post("clubs/:clubId/members/imports")
  importMembers(
    @Param("clubId") clubId: string,
    @Body() input: ImportAdminMembersInput,
  ) {
    return { data: this.repository.importMembers(clubId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/members/:memberId")
  updateMember(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
    @Body() input: UpdateAdminMemberInput,
  ) {
    return { data: this.repository.updateMember(clubId, memberId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/members/:memberId/fee-status")
  updateMemberFeeStatus(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
    @Body("status") status: FeePaymentStatus,
  ) {
    return { data: this.repository.updateMemberFeeStatus(clubId, memberId, status) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/members/:memberId/password")
  resetMemberPassword(
    @Param("memberId") memberId: string,
    @Body() input: ResetMemberPasswordInput,
  ) {
    return { data: this.repository.resetMemberPassword(memberId, input) };
  }

  @RequireClubRole()
  @Delete("clubs/:clubId/members/:memberId")
  removeMember(
    @Param("clubId") clubId: string,
    @Param("memberId") memberId: string,
  ) {
    return { data: this.repository.removeMember(clubId, memberId) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/fees")
  getFees(@Param("clubId") clubId: string) {
    return { data: this.repository.getFees(clubId) };
  }

  @RequireClubRole()
  @Post("clubs/:clubId/fees")
  createFee(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminFeeInput,
  ) {
    return { data: this.repository.createFee(clubId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/fees/:feeId/payments")
  updateFeePayment(
    @Param("clubId") clubId: string,
    @Param("feeId") feeId: string,
    @Body() input: UpdateAdminFeePaymentInput,
  ) {
    return { data: this.repository.updateFeePayment(clubId, feeId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/fees/:feeId")
  updateFee(
    @Param("clubId") clubId: string,
    @Param("feeId") feeId: string,
    @Body() input: UpdateAdminFeeInput,
  ) {
    return { data: this.repository.updateFee(clubId, feeId, input) };
  }

  @RequireClubRole()
  @Delete("clubs/:clubId/fees/:feeId")
  deleteFee(
    @Param("clubId") clubId: string,
    @Param("feeId") feeId: string,
  ) {
    return { data: this.repository.deleteFee(clubId, feeId) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/events/:eventId/attendance")
  updateEventAttendance(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminAttendanceInput,
  ) {
    return { data: this.repository.updateEventAttendance(clubId, eventId, input) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/events")
  getEvents(@Param("clubId") clubId: string) {
    return { data: this.repository.getEvents(clubId) };
  }

  @RequireClubRole()
  @Post("clubs/:clubId/events")
  createEvent(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminEventInput,
  ) {
    return { data: this.repository.createEvent(clubId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/events/:eventId")
  updateEvent(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminEventInput,
  ) {
    return { data: this.repository.updateEvent(clubId, eventId, input) };
  }

  @RequireClubRole()
  @Delete("clubs/:clubId/events/:eventId")
  deleteEvent(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
  ) {
    return { data: this.repository.deleteEvent(clubId, eventId) };
  }

  @Patch("clubs/:clubId/events/:eventId/responses")
  updateEventResponse(
    @Param("clubId") clubId: string,
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminEventResponseInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, input.memberId);
    return { data: this.repository.updateEventResponse(clubId, eventId, input) };
  }

  @RequireClubRole()
  @Get("clubs/:clubId/notices")
  getNotices(@Param("clubId") clubId: string) {
    return { data: this.repository.getNotices(clubId) };
  }

  @RequireClubRole()
  @Post("clubs/:clubId/notices")
  createNotice(
    @Param("clubId") clubId: string,
    @Body() input: CreateAdminNoticeInput,
  ) {
    return { data: this.repository.createNotice(clubId, input) };
  }

  @RequireClubRole()
  @Patch("clubs/:clubId/notices/:noticeId")
  updateNotice(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: UpdateAdminNoticeInput,
  ) {
    return { data: this.repository.updateNotice(clubId, noticeId, input) };
  }

  @RequireClubRole()
  @Delete("clubs/:clubId/notices/:noticeId")
  deleteNotice(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
  ) {
    return { data: this.repository.deleteNotice(clubId, noticeId) };
  }

  @Patch("clubs/:clubId/notices/:noticeId/read")
  markNoticeRead(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: UpdateAdminNoticeReadInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, input.memberId);
    return { data: this.repository.markNoticeRead(clubId, noticeId, input) };
  }

  @Patch("clubs/:clubId/notices/:noticeId/reactions")
  toggleNoticeReaction(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: ToggleAdminNoticeReactionInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, input.memberId);
    return { data: this.repository.toggleNoticeReaction(clubId, noticeId, input) };
  }

  @Post("feedback")
  createFeedback(
    @Body() input: CreateFeedbackInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    return this.repository.createFeedback({ ...input, memberId: user?.sub });
  }

  @Post("clubs/:clubId/notices/:noticeId/comments")
  createNoticeComment(
    @Param("clubId") clubId: string,
    @Param("noticeId") noticeId: string,
    @Body() input: CreateAdminNoticeCommentInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, input.memberId);
    return { data: this.repository.createNoticeComment(clubId, noticeId, input) };
  }
}

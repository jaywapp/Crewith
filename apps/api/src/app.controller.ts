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
} from "@nestjs/common";
import {
  type AcceptInviteInput,
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
  type ReviewJoinRequestInput,
  type SendReminderInput,
  type ToggleAdminNoticeReactionInput,
  type UpdateAdminAttendanceInput,
  type UpdateAdminEventResponseInput,
  type UpdateAdminFeePaymentInput,
  type UpdateAdminMemberInput,
  type UpdateAdminNoticeReadInput,
  type UpdateMemberProfileInput,
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

  @Post("auth/otp/request")
  requestOtp(@Body() input: AuthOtpRequestInput) {
    return this.repository.requestOtp(input);
  }

  @Post("auth/otp/verify")
  verifyOtp(@Body() input: AuthOtpVerifyInput) {
    return { data: this.repository.verifyOtp(input) };
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
  getMemberAppOverview(@Param("memberId") memberId: string) {
    return { data: this.repository.getMemberAppOverview(memberId) };
  }

  @Get("clubs/:clubId/reminders")
  getReminderTargets() {
    return { data: this.repository.getReminderTargets() };
  }

  @Post("clubs/:clubId/reminders/send")
  sendReminder(
    @Body() input: SendReminderInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.sendReminder(input) };
  }

  @Get("clubs/:clubId/members")
  getMembers(@Headers("x-crewith-role") role: string | undefined) {
    assertOperatorRole(role);
    return { data: this.repository.getMembers() };
  }

  @Get("clubs/:clubId/join-requests")
  getJoinRequests(@Headers("x-crewith-role") role: string | undefined) {
    assertOperatorRole(role);
    return { data: this.repository.getJoinRequests() };
  }

  @Post("clubs/:clubId/join-requests")
  createJoinRequest(@Body() input: CreateJoinRequestInput) {
    return { data: this.repository.createJoinRequest(input) };
  }

  @Patch("clubs/:clubId/join-requests/:requestId")
  reviewJoinRequest(
    @Param("requestId") requestId: string,
    @Body() input: ReviewJoinRequestInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.reviewJoinRequest(requestId, input) };
  }

  @Get("clubs/:clubId/invite-links")
  getInviteLinks(@Headers("x-crewith-role") role: string | undefined) {
    assertOperatorRole(role);
    return { data: this.repository.getInviteLinks() };
  }

  @Post("clubs/:clubId/invite-links")
  createInviteLink(
    @Body() input: CreateInviteLinkInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createInviteLink(input) };
  }

  @Post("clubs/:clubId/invite-links/:token/accept")
  acceptInvite(
    @Param("token") token: string,
    @Body() input: AcceptInviteInput,
  ) {
    return { data: this.repository.acceptInvite(token, input) };
  }

  @Post("clubs/:clubId/members")
  createMember(
    @Body() input: CreateAdminMemberInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createMember(input) };
  }

  @Patch("clubs/:clubId/members/:memberId")
  updateMember(
    @Param("memberId") memberId: string,
    @Body() input: UpdateAdminMemberInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateMember(memberId, input) };
  }

  @Patch("clubs/:clubId/members/:memberId/fee-status")
  updateMemberFeeStatus(
    @Param("memberId") memberId: string,
    @Body("status") status: FeePaymentStatus,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateMemberFeeStatus(memberId, status) };
  }

  @Delete("clubs/:clubId/members/:memberId")
  removeMember(
    @Param("memberId") memberId: string,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.removeMember(memberId) };
  }

  @Get("clubs/:clubId/fees")
  getFees(@Headers("x-crewith-role") role: string | undefined) {
    assertOperatorRole(role);
    return { data: this.repository.getFees() };
  }

  @Post("clubs/:clubId/fees")
  createFee(
    @Body() input: CreateAdminFeeInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createFee(input) };
  }

  @Patch("clubs/:clubId/fees/:feeId/payments")
  updateFeePayment(
    @Param("feeId") feeId: string,
    @Body() input: UpdateAdminFeePaymentInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateFeePayment(feeId, input) };
  }

  @Patch("clubs/:clubId/events/:eventId/attendance")
  updateEventAttendance(
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminAttendanceInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.updateEventAttendance(eventId, input) };
  }

  @Get("clubs/:clubId/events")
  getEvents(@Headers("x-crewith-role") role: string | undefined) {
    assertOperatorRole(role);
    return { data: this.repository.getEvents() };
  }

  @Post("clubs/:clubId/events")
  createEvent(
    @Body() input: CreateAdminEventInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createEvent(input) };
  }

  @Patch("clubs/:clubId/events/:eventId/responses")
  updateEventResponse(
    @Param("eventId") eventId: string,
    @Body() input: UpdateAdminEventResponseInput,
  ) {
    return { data: this.repository.updateEventResponse(eventId, input) };
  }

  @Get("clubs/:clubId/notices")
  getNotices(@Headers("x-crewith-role") role: string | undefined) {
    assertOperatorRole(role);
    return { data: this.repository.getNotices() };
  }

  @Post("clubs/:clubId/notices")
  createNotice(
    @Body() input: CreateAdminNoticeInput,
    @Headers("x-crewith-role") role: string | undefined,
  ) {
    assertOperatorRole(role);
    return { data: this.repository.createNotice(input) };
  }

  @Patch("clubs/:clubId/notices/:noticeId/read")
  markNoticeRead(
    @Param("noticeId") noticeId: string,
    @Body() input: UpdateAdminNoticeReadInput,
  ) {
    return { data: this.repository.markNoticeRead(noticeId, input) };
  }

  @Patch("clubs/:clubId/notices/:noticeId/reactions")
  toggleNoticeReaction(
    @Param("noticeId") noticeId: string,
    @Body() input: ToggleAdminNoticeReactionInput,
  ) {
    return { data: this.repository.toggleNoticeReaction(noticeId, input) };
  }

  @Post("clubs/:clubId/notices/:noticeId/comments")
  createNoticeComment(
    @Param("noticeId") noticeId: string,
    @Body() input: CreateAdminNoticeCommentInput,
  ) {
    return { data: this.repository.createNoticeComment(noticeId, input) };
  }
}

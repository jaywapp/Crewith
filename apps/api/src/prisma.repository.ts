import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import {
  type AcceptInviteInput,
  type AdminEventListItem,
  type AdminFeeListItem,
  type AdminInviteLinkListItem,
  type AdminJoinRequestListItem,
  type AdminMemberListItem,
  type AdminNoticeListItem,
  type AdminNotificationLogItem,
  type CreateAdminEventInput,
  type CreateAdminFeeInput,
  type CreateAdminMemberInput,
  type CreateAdminNoticeInput,
  type CreateAdminNoticeCommentInput,
  type CreateClubInput,
  type CreateFeedbackInput,
  type CreateInviteLinkInput,
  type CreateJoinRequestInput,
  type FeedbackResult,
  type FeePaymentStatus,
  type ImportAdminMembersInput,
  type ImportAdminMembersResult,
  type MemberDirectoryItem,
  type MemberNotificationItem,
  type RegisterDeviceInput,
  type RegisterInput,
  type ResetMemberPasswordInput,
  type ReviewJoinRequestInput,
  type SelfResetPasswordInput,
  type SendReminderInput,
  type ToggleAdminNoticeReactionInput,
  type UpdateAdminAttendanceInput,
  type UpdateAdminEventInput,
  type UpdateAdminEventResponseInput,
  type UpdateAdminFeePaymentInput,
  type UpdateAdminMemberInput,
  type UpdateAdminNoticeInput,
  type UpdateAdminNoticeReadInput,
  type UpdateClubFeeSettingsInput,
  type UpdateClubNotificationSettingsInput,
  type UpdateClubPrivacySettingsInput,
  type UpdateMemberProfileInput,
  type AuthLoginInput,
  type buildOverview,
  type buildProfile,
  type buildMemberAppOverview,
  type buildReminderTargets,
  type ensureFeeSettings,
  type ensureNotificationSettings,
  type ensurePrivacySettings,
  type registerMemberDevice,
} from "./mvp.store";
import { MvpRepository } from "./mvp.repository";

// 전화번호 정규화 (현재 store와 동일한 로직)
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("82")) return `0${digits.slice(2)}`;
  return digits;
}

@Injectable()
export class PrismaRepository extends MvpRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createFeedback(_input: CreateFeedbackInput): Promise<FeedbackResult> {
    throw new Error("Not implemented");
  }

  getAdminOverview(_clubId: string): ReturnType<typeof buildOverview> { throw new Error("Not implemented"); }
  login(_input: AuthLoginInput): unknown { throw new Error("Not implemented"); }
  register(_input: RegisterInput): { memberId: string } { throw new Error("Not implemented"); }
  createClub(_input: CreateClubInput): { clubId: string; name: string; sportType: string } { throw new Error("Not implemented"); }
  resetMemberPassword(_memberId: string, _input: ResetMemberPasswordInput): unknown { throw new Error("Not implemented"); }
  selfResetPassword(_input: SelfResetPasswordInput): { success: true } { throw new Error("Not implemented"); }
  registerDevice(_input: RegisterDeviceInput): ReturnType<typeof registerMemberDevice> { throw new Error("Not implemented"); }
  getMemberProfile(_memberId: string): ReturnType<typeof buildProfile> { throw new Error("Not implemented"); }
  updateMemberProfile(_memberId: string, _input: UpdateMemberProfileInput): ReturnType<typeof buildProfile> { throw new Error("Not implemented"); }
  getMemberAppOverview(_clubId: string, _memberId: string): ReturnType<typeof buildMemberAppOverview> { throw new Error("Not implemented"); }
  getMemberDirectory(_clubId: string, _memberId: string): MemberDirectoryItem[] { throw new Error("Not implemented"); }
  getMemberNotifications(_memberId: string): MemberNotificationItem[] { throw new Error("Not implemented"); }
  markMemberNotificationRead(_memberId: string, _notificationId: string): MemberNotificationItem { throw new Error("Not implemented"); }
  getReminderTargets(_clubId: string): ReturnType<typeof buildReminderTargets> { throw new Error("Not implemented"); }
  sendReminder(_clubId: string, _input: SendReminderInput): AdminNotificationLogItem { throw new Error("Not implemented"); }
  getFeeSettings(_clubId: string): ReturnType<typeof ensureFeeSettings> { throw new Error("Not implemented"); }
  updateFeeSettings(_clubId: string, _input: UpdateClubFeeSettingsInput): ReturnType<typeof ensureFeeSettings> { throw new Error("Not implemented"); }
  getNotificationSettings(_clubId: string): ReturnType<typeof ensureNotificationSettings> { throw new Error("Not implemented"); }
  updateNotificationSettings(_clubId: string, _input: UpdateClubNotificationSettingsInput): ReturnType<typeof ensureNotificationSettings> { throw new Error("Not implemented"); }
  getPrivacySettings(_clubId: string): ReturnType<typeof ensurePrivacySettings> { throw new Error("Not implemented"); }
  updatePrivacySettings(_clubId: string, _input: UpdateClubPrivacySettingsInput): ReturnType<typeof ensurePrivacySettings> { throw new Error("Not implemented"); }
  getMembers(_clubId: string): AdminMemberListItem[] { throw new Error("Not implemented"); }
  getJoinRequests(_clubId: string): AdminJoinRequestListItem[] { throw new Error("Not implemented"); }
  createJoinRequest(_clubId: string, _input: CreateJoinRequestInput): AdminJoinRequestListItem { throw new Error("Not implemented"); }
  reviewJoinRequest(_clubId: string, _requestId: string, _input: ReviewJoinRequestInput): AdminJoinRequestListItem { throw new Error("Not implemented"); }
  getInviteLinks(_clubId: string): AdminInviteLinkListItem[] { throw new Error("Not implemented"); }
  createInviteLink(_clubId: string, _input: CreateInviteLinkInput): AdminInviteLinkListItem { throw new Error("Not implemented"); }
  disableInviteLink(_clubId: string, _inviteId: string): AdminInviteLinkListItem { throw new Error("Not implemented"); }
  acceptInvite(_clubId: string, _token: string, _input: AcceptInviteInput): AdminMemberListItem { throw new Error("Not implemented"); }
  createMember(_clubId: string, _input: CreateAdminMemberInput): AdminMemberListItem { throw new Error("Not implemented"); }
  importMembers(_clubId: string, _input: ImportAdminMembersInput): ImportAdminMembersResult { throw new Error("Not implemented"); }
  updateMember(_clubId: string, _memberId: string, _input: UpdateAdminMemberInput): AdminMemberListItem { throw new Error("Not implemented"); }
  updateMemberFeeStatus(_clubId: string, _memberId: string, _status: FeePaymentStatus): AdminMemberListItem { throw new Error("Not implemented"); }
  removeMember(_clubId: string, _memberId: string): AdminMemberListItem { throw new Error("Not implemented"); }
  getFees(_clubId: string): AdminFeeListItem[] { throw new Error("Not implemented"); }
  createFee(_clubId: string, _input: CreateAdminFeeInput): AdminFeeListItem { throw new Error("Not implemented"); }
  updateFeePayment(_clubId: string, _feeId: string, _input: UpdateAdminFeePaymentInput): AdminFeeListItem { throw new Error("Not implemented"); }
  updateEventAttendance(_clubId: string, _eventId: string, _input: UpdateAdminAttendanceInput): AdminEventListItem { throw new Error("Not implemented"); }
  getEvents(_clubId: string): AdminEventListItem[] { throw new Error("Not implemented"); }
  createEvent(_clubId: string, _input: CreateAdminEventInput): AdminEventListItem { throw new Error("Not implemented"); }
  updateEvent(_clubId: string, _eventId: string, _input: UpdateAdminEventInput): AdminEventListItem { throw new Error("Not implemented"); }
  deleteEvent(_clubId: string, _eventId: string): { id: string; deleted: true } { throw new Error("Not implemented"); }
  updateEventResponse(_clubId: string, _eventId: string, _input: UpdateAdminEventResponseInput): AdminEventListItem { throw new Error("Not implemented"); }
  getNotices(_clubId: string): AdminNoticeListItem[] { throw new Error("Not implemented"); }
  createNotice(_clubId: string, _input: CreateAdminNoticeInput): AdminNoticeListItem { throw new Error("Not implemented"); }
  updateNotice(_clubId: string, _noticeId: string, _input: UpdateAdminNoticeInput): AdminNoticeListItem { throw new Error("Not implemented"); }
  deleteNotice(_clubId: string, _noticeId: string): { id: string; deleted: true } { throw new Error("Not implemented"); }
  markNoticeRead(_clubId: string, _noticeId: string, _input: UpdateAdminNoticeReadInput): AdminNoticeListItem { throw new Error("Not implemented"); }
  toggleNoticeReaction(_clubId: string, _noticeId: string, _input: ToggleAdminNoticeReactionInput): AdminNoticeListItem { throw new Error("Not implemented"); }
  createNoticeComment(_clubId: string, _noticeId: string, _input: CreateAdminNoticeCommentInput): AdminNoticeListItem { throw new Error("Not implemented"); }
}

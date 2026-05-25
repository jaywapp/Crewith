import { BadRequestException, NotFoundException } from "@nestjs/common";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
export type FeePaymentStatus = "unpaid" | "paid" | "exempt";
export type FeeType = "recurring" | "one_time";
export type EventResponseValue = "attending" | "not_attending";
export type AttendanceStatus = "present" | "late" | "absent";
export type ClubRole = "owner" | "operator" | "member";
export type MemberStatus = "active" | "dormant" | "left" | "removed";
export type ClubVisibility = "public" | "private";
export type ResourceVisibility = "all_members" | "operators_only";
export type SubscriptionStatus = "trial" | "active" | "expired" | "suspended";
export type ReminderType = "fee_overdue" | "notice_unread" | "event_no_response";

export interface ClubListItem {
  id: string;
  name: string;
  sportType: string;
  visibility: ClubVisibility;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
}

export interface ClubMembershipItem {
  clubId: string;
  memberId: string;
  role: ClubRole;
  memberStatus: MemberStatus;
  joinedAt: string;
}

export interface DashboardSummary {
  totalMemberCount: number;
  activeMemberCount: number;
  overdueMemberCount: number;
  noticeReadRate: number;
  attendanceRate: number;
  attendanceConversionRate: number;
  monthlyFeeCollectionRate: number;
}

export interface AdminClubOverview {
  club: {
    id: string;
    name: string;
    sportType: string;
    visibility: ClubVisibility;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt: string;
  };
  dashboard: DashboardSummary;
  feeSettings: ClubFeeSettingsItem;
  privacySettings: ClubPrivacySettingsItem;
  notificationSettings: ClubNotificationSettingsItem;
  members: AdminMemberListItem[];
  fees: AdminFeeListItem[];
  events: AdminEventListItem[];
  notices: AdminNoticeListItem[];
  joinRequests: AdminJoinRequestListItem[];
  inviteLinks: AdminInviteLinkListItem[];
  reminderTargets: AdminReminderTargetGroup[];
  notificationLogs: AdminNotificationLogItem[];
  tasks: AdminTaskItem[];
}

export interface AdminJoinRequestListItem {
  id: string;
  applicantName: string;
  applicantPhone: string;
  greeting: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface AdminInviteLinkListItem {
  id: string;
  token: string;
  expiresAt: string;
  disabled: boolean;
  createdAt: string;
}

export interface AdminMemberListItem {
  id: string;
  name: string;
  phoneNumber: string;
  birthDate?: string;
  gender?: string;
  role: ClubRole;
  memberStatus: MemberStatus;
  joinedAt: string;
  leftAt?: string;
  personalDataDeleteAt?: string;
  lastFeeStatus: FeePaymentStatus;
  attendanceRate: number;
  password: string;
}

export interface ClubPrivacySettingsItem {
  clubId: string;
  showPhoneNumberToMembers: boolean;
  showBirthDateToMembers: boolean;
  showGenderToMembers: boolean;
}

export interface ClubNotificationSettingsItem {
  clubId: string;
  eventReminderEnabled: boolean;
  eventReminderHoursBefore: number[];
  feeReminderEnabled: boolean;
  feeReminderDaysAfterDue: number[];
  noticeUnreadReminderEnabled: boolean;
  noticeUnreadReminderHoursAfter: number[];
}

export interface MemberDirectoryItem {
  id: string;
  name: string;
  role: ClubRole;
  memberStatus: MemberStatus;
  joinedAt: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
}

export interface AdminFeeListItem {
  id: string;
  title: string;
  feeType: FeeType;
  amount: number;
  dueDate: string;
  targetCount: number;
  paidCount: number;
  unpaidCount: number;
  exemptCount: number;
  collectionRate: number;
  payments: AdminFeePaymentListItem[];
}

export interface AdminFeePaymentListItem {
  memberId: string;
  memberName: string;
  status: FeePaymentStatus;
}

export interface AdminEventListItem {
  id: string;
  title: string;
  startsAt: string;
  locationName: string;
  locationAddress?: string;
  responseDeadline?: string;
  visibility: ResourceVisibility;
  attendingCount: number;
  notAttendingCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  attendanceConversionRate: number;
  participants: AdminEventParticipantListItem[];
}

export interface AdminEventParticipantListItem {
  memberId: string;
  memberName: string;
  response: EventResponseValue;
  attendanceStatus: AttendanceStatus;
  companionCount: number;
}

export interface AdminNoticeListItem {
  id: string;
  title: string;
  body: string;
  visibility: ResourceVisibility;
  createdAt: string;
  readCount: number;
  unreadCount: number;
  likeCount: number;
  commentCount: number;
  readers: AdminNoticeReaderListItem[];
  comments: AdminNoticeCommentListItem[];
}

export interface AdminNoticeReaderListItem {
  memberId: string;
  memberName: string;
  read: boolean;
}

export interface AdminNoticeCommentListItem {
  id: string;
  memberName: string;
  body: string;
  createdAt: string;
}

export interface AdminTaskItem {
  id: string;
  label: string;
  value: string;
  severity: "info" | "warning" | "danger";
}

export interface AdminReminderTargetGroup {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  targetCount: number;
  targets: AdminReminderTargetItem[];
}

export interface AdminReminderTargetItem {
  memberId: string;
  memberName: string;
  phoneNumber: string;
  reason: string;
}

export interface AdminNotificationLogItem {
  id: string;
  type: ReminderType;
  title: string;
  targetCount: number;
  sentAt: string;
  channel: "app_push";
  deliveredCount?: number;
  skippedCount?: number;
}

export interface ClubFeeSettingsItem {
  clubId: string;
  amount: number;
  dueDay: number;
  intervalType: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "custom";
  customIntervalDays?: number;
  gracePeriodDays: number;
  autoReminderEnabled: boolean;
  reminderDaysAfterDue: number[];
}

export interface MemberNotificationItem {
  id: string;
  memberId: string;
  clubId: string;
  type: ReminderType;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface MemberDeviceItem {
  id: string;
  memberId: string;
  platform: "android" | "ios" | "web";
  fcmToken: string;
  registeredAt: string;
  lastSeenAt: string;
  disabled: boolean;
}

export interface MemberProfile {
  memberId: string;
  name: string;
  phoneNumber: string;
  profileImageUrl?: string;
}

export interface AuthLoginInput {
  phoneNumber: string;
  password: string;
}

export interface ResetMemberPasswordInput {
  password: string;
}

export interface UpdateMemberProfileInput {
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface SendReminderInput {
  reminderId: string;
}

export interface RegisterDeviceInput {
  memberId: string;
  platform: "android" | "ios" | "web";
  fcmToken: string;
}

export interface MvpStore {
  clubs: ClubListItem[];
  members: AdminMemberListItem[];
  clubMemberships: ClubMembershipItem[];
  memberDevices: MemberDeviceItem[];
  feeSettings: Record<string, ClubFeeSettingsItem>;
  privacySettings: Record<string, ClubPrivacySettingsItem>;
  notificationSettings: Record<string, ClubNotificationSettingsItem>;
  fees: AdminFeeListItem[];
  feePayments: Record<string, Record<string, FeePaymentStatus>>;
  events: AdminEventListItem[];
  eventResponses: Record<string, Record<string, EventResponseValue>>;
  eventAttendance: Record<string, Record<string, { status: AttendanceStatus; companionCount: number }>>;
  notices: AdminNoticeListItem[];
  noticeReads: Record<string, string[]>;
  noticeLikes: Record<string, string[]>;
  noticeComments: Record<string, AdminNoticeCommentListItem[]>;
  joinRequests: AdminJoinRequestListItem[];
  inviteLinks: AdminInviteLinkListItem[];
  notificationLogs: AdminNotificationLogItem[];
  memberNotifications: MemberNotificationItem[];
  profileImages: Record<string, string>;
}

export interface MemberAppOverview {
  club: {
    id: string;
    name: string;
    sportType: string;
  };
  member: {
    id: string;
    name: string;
    role: ClubRole;
  };
  fees: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: FeePaymentStatus;
  }>;
  events: Array<{
    id: string;
    title: string;
    startsAt: string;
    locationName: string;
    locationAddress?: string;
    visibility: ResourceVisibility;
    response: EventResponseValue;
    attendanceStatus: AttendanceStatus;
    companionCount: number;
  }>;
  notices: Array<{
    id: string;
    title: string;
    body: string;
    visibility: ResourceVisibility;
    read: boolean;
    liked: boolean;
    likeCount: number;
    commentCount: number;
    comments: AdminNoticeCommentListItem[];
  }>;
}

export interface CreateAdminMemberInput {
  name: string;
  phoneNumber: string;
  role?: ClubRole;
  password?: string;
}

export interface ImportAdminMembersInput {
  rows: string;
}

export interface ImportAdminMembersResult {
  createdCount: number;
  skippedCount: number;
  errors: Array<{
    row: number;
    reason: string;
    value: string;
  }>;
  members: AdminMemberListItem[];
}

export interface UpdateAdminMemberInput {
  name?: string;
  phoneNumber?: string;
  role?: ClubRole;
  memberStatus?: MemberStatus;
  lastFeeStatus?: FeePaymentStatus;
  password?: string;
}

export interface CreateAdminFeeInput {
  title: string;
  feeType?: FeeType;
  amount: number;
  dueDate: string;
}

export interface UpdateAdminFeePaymentInput {
  memberId: string;
  status: FeePaymentStatus;
}

export interface CreateAdminEventInput {
  title: string;
  startsAt: string;
  locationName: string;
  locationAddress?: string;
  responseDeadline?: string;
  visibility?: ResourceVisibility;
}

export interface UpdateAdminEventInput {
  title?: string;
  startsAt?: string;
  locationName?: string;
  locationAddress?: string;
  responseDeadline?: string;
  visibility?: ResourceVisibility;
}

export interface UpdateClubFeeSettingsInput {
  amount?: number;
  dueDay?: number;
  intervalType?: ClubFeeSettingsItem["intervalType"];
  customIntervalDays?: number;
  gracePeriodDays?: number;
  autoReminderEnabled?: boolean;
  reminderDaysAfterDue?: number[];
}

export interface UpdateClubPrivacySettingsInput {
  showPhoneNumberToMembers?: boolean;
  showBirthDateToMembers?: boolean;
  showGenderToMembers?: boolean;
}

export interface UpdateClubNotificationSettingsInput {
  eventReminderEnabled?: boolean;
  eventReminderHoursBefore?: number[];
  feeReminderEnabled?: boolean;
  feeReminderDaysAfterDue?: number[];
  noticeUnreadReminderEnabled?: boolean;
  noticeUnreadReminderHoursAfter?: number[];
}

export interface UpdateAdminEventResponseInput {
  memberId: string;
  response: EventResponseValue;
}

export interface UpdateAdminAttendanceInput {
  memberId: string;
  status: AttendanceStatus;
  companionCount?: number;
}

export interface CreateAdminNoticeInput {
  title: string;
  body: string;
  visibility?: ResourceVisibility;
}

export interface UpdateAdminNoticeInput {
  title?: string;
  body?: string;
  visibility?: ResourceVisibility;
}

export interface UpdateAdminNoticeReadInput {
  memberId: string;
}

export interface CreateAdminNoticeCommentInput {
  memberId: string;
  body: string;
}

export interface ToggleAdminNoticeReactionInput {
  memberId: string;
}

export interface CreateJoinRequestInput {
  applicantName: string;
  applicantPhone: string;
  greeting: string;
}

export interface ReviewJoinRequestInput {
  status: "approved" | "rejected";
}

export interface CreateInviteLinkInput {
  expiresInDays?: number;
}

export interface AcceptInviteInput {
  applicantName: string;
  applicantPhone: string;
}

export interface RegisterInput {
  name: string;
  phoneNumber: string;
  password: string;
  birthDate?: string;
}

export interface CreateClubInput {
  name: string;
  sportType: string;
  ownerMemberId: string;
}

export type FeedbackCategory = "bug" | "improvement" | "other";

export interface CreateFeedbackInput {
  title: string;
  body: string;
  category: FeedbackCategory;
  memberId?: string;
}

export interface FeedbackResult {
  issueNumber: number;
  issueUrl: string;
}

export const club: ClubListItem = {
  id: "club-seoul-runners",
  name: "서울 러너스",
  sportType: "러닝",
  visibility: "private" as const,
  subscriptionStatus: "trial" as const,
  trialEndsAt: "2026-12-31",
};

export const clubs: ClubListItem[] = [club];

export function ensureClub(clubId: string) {
  const currentClub = clubs.find((item) => item.id === clubId);

  if (!currentClub) {
    throw new NotFoundException("Club not found");
  }

  return currentClub;
}

export const members: AdminMemberListItem[] = [];

export const clubMemberships: ClubMembershipItem[] = [];

export const feeSettings: Record<string, ClubFeeSettingsItem> = {};

export function ensureFeeSettings(clubId: string): ClubFeeSettingsItem {
  ensureClub(clubId);
  feeSettings[clubId] ??= {
    clubId,
    amount: 30000,
    dueDay: 25,
    intervalType: "monthly",
    gracePeriodDays: 3,
    autoReminderEnabled: true,
    reminderDaysAfterDue: [1, 3, 7],
  };

  return feeSettings[clubId];
}

export const privacySettings: Record<string, ClubPrivacySettingsItem> = {};

export function ensurePrivacySettings(clubId: string): ClubPrivacySettingsItem {
  ensureClub(clubId);
  privacySettings[clubId] ??= {
    clubId,
    showPhoneNumberToMembers: false,
    showBirthDateToMembers: false,
    showGenderToMembers: false,
  };

  return privacySettings[clubId];
}

export const notificationSettings: Record<string, ClubNotificationSettingsItem> = {};

export function ensureNotificationSettings(clubId: string): ClubNotificationSettingsItem {
  ensureClub(clubId);
  notificationSettings[clubId] ??= {
    clubId,
    eventReminderEnabled: true,
    eventReminderHoursBefore: [24, 3],
    feeReminderEnabled: true,
    feeReminderDaysAfterDue: [1, 3, 7],
    noticeUnreadReminderEnabled: true,
    noticeUnreadReminderHoursAfter: [24, 48],
  };

  return notificationSettings[clubId];
}

export const fees: AdminFeeListItem[] = [];

export const feePayments: Record<string, Record<string, FeePaymentStatus>> = {};

export const events: AdminEventListItem[] = [];

export const eventResponses: Record<string, Record<string, EventResponseValue>> = {};

export const eventAttendance: Record<string, Record<string, { status: AttendanceStatus; companionCount: number }>> = {};

export const notices: AdminNoticeListItem[] = [];

export const noticeReads: Record<string, Set<string>> = {};

export const noticeLikes: Record<string, Set<string>> = {};

export const noticeComments: Record<string, AdminNoticeCommentListItem[]> = {};

export const joinRequests: AdminJoinRequestListItem[] = [];

export const inviteLinks: AdminInviteLinkListItem[] = [];

export const notificationLogs: AdminNotificationLogItem[] = [];
export const memberNotifications: MemberNotificationItem[] = [];
export const memberDevices: MemberDeviceItem[] = [];
export const profileImages = new Map<string, string>();
export const dataFilePath = process.env.CREWITH_DATA_FILE ?? join(process.cwd(), "data", "mvp-store.json");

export function replaceArray<T>(target: T[], next: T[] | undefined) {
  if (!Array.isArray(next)) {
    return;
  }

  target.splice(0, target.length, ...next);
}

export function replaceRecord<T>(target: Record<string, T>, next: Record<string, T> | undefined) {
  if (!next || typeof next !== "object") {
    return;
  }

  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, next);
}

export function serializeSetRecord(source: Record<string, Set<string>>) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, [...value]]));
}

export function hydrateSetRecord(target: Record<string, Set<string>>, source: Record<string, string[]> | undefined) {
  if (!source || typeof source !== "object") {
    return;
  }

  for (const key of Object.keys(target)) {
    delete target[key];
  }

  for (const [key, value] of Object.entries(source)) {
    target[key] = new Set(Array.isArray(value) ? value : []);
  }
}

export function persistStore() {
  const store: MvpStore = {
    clubs,
    members,
    clubMemberships,
    memberDevices,
    feeSettings,
    privacySettings,
    notificationSettings,
    fees,
    feePayments,
    events,
    eventResponses,
    eventAttendance,
    notices,
    noticeReads: serializeSetRecord(noticeReads),
    noticeLikes: serializeSetRecord(noticeLikes),
    noticeComments,
    joinRequests,
    inviteLinks,
    notificationLogs,
    memberNotifications,
    profileImages: Object.fromEntries(profileImages),
  };

  mkdirSync(dirname(dataFilePath), { recursive: true });
  writeFileSync(dataFilePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export function hydrateStore() {
  if (!existsSync(dataFilePath)) {
    persistStore();
    return;
  }

  try {
    const store = JSON.parse(readFileSync(dataFilePath, "utf8")) as Partial<MvpStore>;

    replaceArray(clubs, store.clubs);
    replaceArray(members, store.members);
    for (const member of members) {
      if (!member.password) {
        const digits = member.phoneNumber.replace(/\D/g, "");
        member.password = digits.slice(-4);
      }
    }
    replaceArray(clubMemberships, store.clubMemberships);
    replaceArray(memberDevices, store.memberDevices);
    replaceRecord(feeSettings, store.feeSettings);
    replaceRecord(privacySettings, store.privacySettings);
    replaceRecord(notificationSettings, store.notificationSettings);
    replaceArray(fees, store.fees);
    replaceRecord(feePayments, store.feePayments);
    replaceArray(events, store.events);
    replaceRecord(eventResponses, store.eventResponses);
    replaceRecord(eventAttendance, store.eventAttendance);
    replaceArray(notices, store.notices);
    hydrateSetRecord(noticeReads, store.noticeReads);
    hydrateSetRecord(noticeLikes, store.noticeLikes);
    replaceRecord(noticeComments, store.noticeComments);
    replaceArray(joinRequests, store.joinRequests);
    replaceArray(inviteLinks, store.inviteLinks);
    replaceArray(notificationLogs, store.notificationLogs);
    replaceArray(memberNotifications, store.memberNotifications);
    profileImages.clear();

    for (const [memberId, imageUrl] of Object.entries(store.profileImages ?? {})) {
      profileImages.set(memberId, imageUrl);
    }
  } catch {
    persistStore();
  }
}

export function normalizePhoneNumber(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function buildProfile(member: AdminMemberListItem): MemberProfile {
  return {
    memberId: member.id,
    name: member.name,
    phoneNumber: member.phoneNumber,
    profileImageUrl: profileImages.get(member.id),
  };
}

export function applyMemberPrivacyRetention(member: AdminMemberListItem, status: MemberStatus) {
  member.memberStatus = status;

  if (status === "left" || status === "removed" || status === "dormant") {
    const now = new Date();
    member.leftAt ??= now.toISOString();
    member.personalDataDeleteAt ??= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return;
  }

  delete member.leftAt;
  delete member.personalDataDeleteAt;
}

export function initializeMemberState(member: AdminMemberListItem) {
  for (const fee of fees) {
    feePayments[fee.id] ??= {};
    feePayments[fee.id][member.id] ??= "unpaid";
  }

  for (const event of events) {
    eventResponses[event.id] ??= {};
    eventAttendance[event.id] ??= {};
    eventResponses[event.id][member.id] ??= "not_attending";
    eventAttendance[event.id][member.id] ??= { status: "absent", companionCount: 0 };
  }

  for (const notice of notices) {
    noticeReads[notice.id] ??= new Set();
  }
}

export function createMemberFromProfile(name: string, phoneNumber: string): AdminMemberListItem {
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const nextMember: AdminMemberListItem = {
    id: `member-${Date.now()}`,
    name,
    phoneNumber,
    role: "member",
    memberStatus: "active",
    joinedAt: new Date().toISOString().slice(0, 10),
    lastFeeStatus: "unpaid",
    attendanceRate: 0,
    password: phoneDigits.slice(-4),
  };

  members.push(nextMember);
  clubMemberships.push({
    clubId: club.id,
    memberId: nextMember.id,
    role: "member",
    memberStatus: "active",
    joinedAt: nextMember.joinedAt,
  });
  initializeMemberState(nextMember);
  return nextMember;
}

hydrateStore();

export function findClubMembership(clubId: string, memberId: string) {
  ensureClub(clubId);
  const membership = clubMemberships.find(
    (item) => item.clubId === clubId && item.memberId === memberId && item.memberStatus !== "removed",
  );

  if (!membership) {
    throw new NotFoundException("Club membership not found");
  }

  return membership;
}

export function clubMembershipSummaries(memberId: string) {
  return clubMemberships
    .filter((membership) => membership.memberId === memberId && membership.memberStatus !== "removed")
    .map((membership) => {
      const currentClub = ensureClub(membership.clubId);

      return {
        clubId: currentClub.id,
        name: currentClub.name,
        sportType: currentClub.sportType,
        role: membership.role,
        memberStatus: membership.memberStatus,
      };
    });
}

export function memberWithMembership(membership: ClubMembershipItem): AdminMemberListItem {
  const member = findMember(membership.memberId);

  return {
    ...member,
    role: membership.role,
    memberStatus: membership.memberStatus,
    joinedAt: membership.joinedAt,
  };
}

export function activeMembers(clubId = club.id) {
  ensureClub(clubId);
  return clubMemberships
    .filter((membership) => membership.clubId === clubId && membership.memberStatus === "active")
    .map((membership) => memberWithMembership(membership));
}

export function visibleMembers(clubId = club.id) {
  ensureClub(clubId);
  return clubMemberships
    .filter((membership) => membership.clubId === clubId && membership.memberStatus !== "removed")
    .map((membership) => memberWithMembership(membership));
}

export function findMember(memberId: string) {
  const member = members.find((item) => item.id === memberId);

  if (!member) {
    throw new NotFoundException("Member not found");
  }

  return member;
}

export function registerMemberDevice(input: RegisterDeviceInput): MemberDeviceItem {
  const member = findMember(input.memberId);
  const fcmToken = `${input.fcmToken ?? ""}`.trim();
  const platform = input.platform === "ios" || input.platform === "web" ? input.platform : "android";

  if (!fcmToken) {
    throw new BadRequestException("Device token is required");
  }

  const now = new Date().toISOString();
  const existingDevice = memberDevices.find((device) => device.fcmToken === fcmToken);

  if (existingDevice) {
    existingDevice.memberId = member.id;
    existingDevice.platform = platform;
    existingDevice.lastSeenAt = now;
    existingDevice.disabled = false;
    persistStore();
    return existingDevice;
  }

  const nextDevice: MemberDeviceItem = {
    id: `device-${Date.now()}`,
    memberId: member.id,
    platform,
    fcmToken,
    registeredAt: now,
    lastSeenAt: now,
    disabled: false,
  };

  memberDevices.unshift(nextDevice);
  persistStore();
  return nextDevice;
}

export function findFee(feeId: string) {
  const fee = fees.find((item) => item.id === feeId);

  if (!fee) {
    throw new NotFoundException("Fee not found");
  }

  return fee;
}

export function findEvent(eventId: string) {
  const event = events.find((item) => item.id === eventId);

  if (!event) {
    throw new NotFoundException("Event not found");
  }

  return event;
}

export function findNotice(noticeId: string) {
  const notice = notices.find((item) => item.id === noticeId);

  if (!notice) {
    throw new NotFoundException("Notice not found");
  }

  return notice;
}

export function findJoinRequest(requestId: string) {
  const request = joinRequests.find((item) => item.id === requestId);

  if (!request) {
    throw new NotFoundException("Join request not found");
  }

  return request;
}

export function findInviteByToken(token: string) {
  const invite = inviteLinks.find((item) => item.token === token && !item.disabled);

  if (!invite) {
    throw new NotFoundException("Invite link not found");
  }

  return invite;
}

export function isClubRole(value: unknown): value is ClubRole {
  return value === "owner" || value === "operator" || value === "member";
}

export function isMemberStatus(value: unknown): value is MemberStatus {
  return value === "active" || value === "dormant" || value === "left" || value === "removed";
}

export function isFeePaymentStatus(value: unknown): value is FeePaymentStatus {
  return value === "unpaid" || value === "paid" || value === "exempt";
}

export function isFeeType(value: unknown): value is FeeType {
  return value === "recurring" || value === "one_time";
}

export function isEventResponse(value: unknown): value is EventResponseValue {
  return value === "attending" || value === "not_attending";
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === "present" || value === "late" || value === "absent";
}

export function isResourceVisibility(value: unknown): value is ResourceVisibility {
  return value === "all_members" || value === "operators_only";
}

export function buildFeeItem(fee: AdminFeeListItem, clubId = club.id): AdminFeeListItem {
  const payments = feePayments[fee.id] ?? {};
  const targetMembers = activeMembers(clubId);
  const paidCount = targetMembers.filter((member) => payments[member.id] === "paid").length;
  const exemptCount = targetMembers.filter((member) => payments[member.id] === "exempt").length;
  const unpaidCount = targetMembers.filter((member) => payments[member.id] !== "paid" && payments[member.id] !== "exempt").length;
  const payableCount = Math.max(targetMembers.length - exemptCount, 0);

  return {
    ...fee,
    targetCount: targetMembers.length,
    paidCount,
    unpaidCount,
    exemptCount,
    collectionRate: payableCount === 0 ? 100 : Math.round((paidCount / payableCount) * 100),
    payments: targetMembers.map((member) => ({
      memberId: member.id,
      memberName: member.name,
      status: payments[member.id] ?? "unpaid",
    })),
  };
}

export function buildFees(clubId = club.id) {
  return fees.map((fee) => buildFeeItem(fee, clubId));
}

export function ensureFeeTargets(feeId: string, clubId = club.id) {
  feePayments[feeId] ??= {};

  for (const member of activeMembers(clubId)) {
    feePayments[feeId][member.id] ??= "unpaid";
  }
}

export function ensureEventTargets(eventId: string, clubId = club.id) {
  eventResponses[eventId] ??= {};
  eventAttendance[eventId] ??= {};

  for (const member of activeMembers(clubId)) {
    eventResponses[eventId][member.id] ??= "not_attending";
    eventAttendance[eventId][member.id] ??= { status: "absent", companionCount: 0 };
  }
}

export function buildEventItem(event: AdminEventListItem, clubId = club.id): AdminEventListItem {
  ensureEventTargets(event.id, clubId);

  const targetMembers = activeMembers(clubId);
  const responses = eventResponses[event.id] ?? {};
  const attendance = eventAttendance[event.id] ?? {};
  const attendingCount = targetMembers.filter((member) => responses[member.id] === "attending").length;
  const notAttendingCount = targetMembers.filter((member) => responses[member.id] !== "attending").length;
  const presentCount = targetMembers.filter((member) => attendance[member.id]?.status === "present").length;
  const lateCount = targetMembers.filter((member) => attendance[member.id]?.status === "late").length;
  const absentCount = targetMembers.filter((member) => attendance[member.id]?.status === "absent").length;
  const attendedCount = presentCount + lateCount;
  const checkedCount = attendedCount + absentCount;

  return {
    ...event,
    visibility: isResourceVisibility(event.visibility) ? event.visibility : "all_members",
    attendingCount,
    notAttendingCount,
    presentCount,
    lateCount,
    absentCount,
    attendanceRate: checkedCount === 0 ? 0 : Math.round((attendedCount / checkedCount) * 100),
    attendanceConversionRate: attendingCount === 0 ? 0 : Math.round((attendedCount / attendingCount) * 100),
    participants: targetMembers.map((member) => ({
      memberId: member.id,
      memberName: member.name,
      response: responses[member.id] ?? "not_attending",
      attendanceStatus: attendance[member.id]?.status ?? "absent",
      companionCount: attendance[member.id]?.companionCount ?? 0,
    })),
  };
}

export function buildEvents(clubId = club.id) {
  return events.map((event) => buildEventItem(event, clubId));
}

export function noticeTargetMembers(notice: AdminNoticeListItem, clubId = club.id) {
  const targetMembers = activeMembers(clubId);

  if (notice.visibility === "operators_only") {
    return targetMembers.filter((member) => member.role === "owner" || member.role === "operator");
  }

  return targetMembers;
}

export function buildNoticeItem(notice: AdminNoticeListItem, clubId = club.id): AdminNoticeListItem {
  noticeReads[notice.id] ??= new Set();
  noticeLikes[notice.id] ??= new Set();
  noticeComments[notice.id] ??= [];

  const targetMembers = noticeTargetMembers(notice, clubId);
  const readCount = targetMembers.filter((member) => noticeReads[notice.id].has(member.id)).length;
  const unreadCount = Math.max(targetMembers.length - readCount, 0);

  return {
    ...notice,
    readCount,
    unreadCount,
    likeCount: noticeLikes[notice.id].size,
    commentCount: noticeComments[notice.id].length,
    readers: targetMembers.map((member) => ({
      memberId: member.id,
      memberName: member.name,
      read: noticeReads[notice.id].has(member.id),
    })),
    comments: noticeComments[notice.id],
  };
}

export function buildNotices(clubId = club.id) {
  return notices.map((notice) => buildNoticeItem(notice, clubId));
}

export function buildReminderTargets(clubId = club.id): AdminReminderTargetGroup[] {
  return buildConfiguredReminderTargets(clubId);
}

export function buildConfiguredReminderTargets(clubId = club.id): AdminReminderTargetGroup[] {
  const reminderTargets: AdminReminderTargetGroup[] = [];
  const settings = ensureNotificationSettings(clubId);
  const latestFee = buildFees(clubId)[0];
  const upcomingEvent = buildEvents(clubId)[0];
  const latestNotice = buildNotices(clubId)[0];

  if (latestFee && settings.feeReminderEnabled) {
    const targets = latestFee.payments
      .filter((payment) => payment.status === "unpaid")
      .map((payment) => {
        const member = findMember(payment.memberId);

        return {
          memberId: member.id,
          memberName: member.name,
          phoneNumber: member.phoneNumber,
          reason: `${latestFee.title} ${latestFee.dueDate}까지 미납`,
        };
      });

    reminderTargets.push({
      id: `fee:${latestFee.id}`,
      type: "fee_overdue",
      title: "회비 미납 리마인더",
      description: `${latestFee.title} 미납 회원에게 앱 푸시를 보냅니다. 발송 기준: 납부일 후 ${settings.feeReminderDaysAfterDue.join(", ")}일`,
      targetCount: targets.length,
      targets,
    });
  }

  if (upcomingEvent && settings.eventReminderEnabled) {
    const targets = upcomingEvent.participants
      .filter((participant) => participant.response === "not_attending")
      .map((participant) => {
        const member = findMember(participant.memberId);

        return {
          memberId: member.id,
          memberName: member.name,
          phoneNumber: member.phoneNumber,
          reason: `${upcomingEvent.title} 참석 의사 확인 필요`,
        };
      });

    reminderTargets.push({
      id: `event:${upcomingEvent.id}`,
      type: "event_no_response",
      title: "일정 참석 확인 리마인더",
      description: `${upcomingEvent.title} 참석 의사를 다시 요청합니다. 발송 기준: 시작 전 ${settings.eventReminderHoursBefore.join(", ")}시간`,
      targetCount: targets.length,
      targets,
    });
  }

  if (latestNotice && settings.noticeUnreadReminderEnabled) {
    const targets = latestNotice.readers
      .filter((reader) => !reader.read)
      .map((reader) => {
        const member = findMember(reader.memberId);

        return {
          memberId: member.id,
          memberName: member.name,
          phoneNumber: member.phoneNumber,
          reason: `${latestNotice.title} 미확인`,
        };
      });

    reminderTargets.push({
      id: `notice:${latestNotice.id}`,
      type: "notice_unread",
      title: "공지 미확인 리마인더",
      description: `${latestNotice.title} 미확인 회원에게 확인을 요청합니다. 발송 기준: 게시 후 ${settings.noticeUnreadReminderHoursAfter.join(", ")}시간`,
      targetCount: targets.length,
      targets,
    });
  }

  return reminderTargets;
}

export function buildLegacyReminderTargets(clubId = club.id): AdminReminderTargetGroup[] {
  const reminderTargets: AdminReminderTargetGroup[] = [];
  const latestFee = buildFees(clubId)[0];
  const upcomingEvent = buildEvents(clubId)[0];
  const latestNotice = buildNotices(clubId)[0];

  if (latestFee) {
    const targets = latestFee.payments
      .filter((payment) => payment.status === "unpaid")
      .map((payment) => {
        const member = findMember(payment.memberId);

        return {
          memberId: member.id,
          memberName: member.name,
          phoneNumber: member.phoneNumber,
          reason: `${latestFee.title} ${latestFee.dueDate}까지 미납`,
        };
      });

    reminderTargets.push({
      id: `fee:${latestFee.id}`,
      type: "fee_overdue",
      title: "회비 미납 리마인더",
      description: `${latestFee.title} 미납 회원에게 앱 푸시를 보냅니다.`,
      targetCount: targets.length,
      targets,
    });
  }

  if (upcomingEvent) {
    const targets = upcomingEvent.participants
      .filter((participant) => participant.response === "not_attending")
      .map((participant) => {
        const member = findMember(participant.memberId);

        return {
          memberId: member.id,
          memberName: member.name,
          phoneNumber: member.phoneNumber,
          reason: `${upcomingEvent.title} 참석 의사 확인 필요`,
        };
      });

    reminderTargets.push({
      id: `event:${upcomingEvent.id}`,
      type: "event_no_response",
      title: "일정 참석 확인 리마인더",
      description: `${upcomingEvent.title} 참석 의사를 다시 요청합니다.`,
      targetCount: targets.length,
      targets,
    });
  }

  if (latestNotice) {
    const targets = latestNotice.readers
      .filter((reader) => !reader.read)
      .map((reader) => {
        const member = findMember(reader.memberId);

        return {
          memberId: member.id,
          memberName: member.name,
          phoneNumber: member.phoneNumber,
          reason: `${latestNotice.title} 미확인`,
        };
      });

    reminderTargets.push({
      id: `notice:${latestNotice.id}`,
      type: "notice_unread",
      title: "공지 미확인 리마인더",
      description: `${latestNotice.title} 미확인 회원에게 확인을 요청합니다.`,
      targetCount: targets.length,
      targets,
    });
  }

  return reminderTargets;
}

export function buildDashboard(clubId = club.id): DashboardSummary {
  const totalMemberCount = visibleMembers(clubId).length;
  const activeMemberCount = activeMembers(clubId).length;
  const monthlyFee = fees[0] ? buildFeeItem(fees[0], clubId) : null;
  const overdueMemberCount = monthlyFee?.unpaidCount ?? 0;
  const latestEvent = events[0] ? buildEventItem(events[0], clubId) : null;
  const latestNotice = notices[0] ? buildNoticeItem(notices[0], clubId) : null;

  return {
    totalMemberCount,
    activeMemberCount,
    overdueMemberCount,
    noticeReadRate:
      !latestNotice || latestNotice.readCount + latestNotice.unreadCount === 0
        ? 100
        : Math.round((latestNotice.readCount / (latestNotice.readCount + latestNotice.unreadCount)) * 100),
    attendanceRate: latestEvent?.attendanceRate ?? 0,
    attendanceConversionRate: latestEvent?.attendanceConversionRate ?? 0,
    monthlyFeeCollectionRate: monthlyFee?.collectionRate ?? 100,
  };
}

export function buildOverview(clubId = club.id): AdminClubOverview {
  const currentClub = ensureClub(clubId);
  const dashboard = buildDashboard(clubId);
  const reminderTargets = buildReminderTargets(clubId);

  return {
    club: currentClub,
    dashboard,
    feeSettings: ensureFeeSettings(clubId),
    privacySettings: ensurePrivacySettings(clubId),
    notificationSettings: ensureNotificationSettings(clubId),
    members: visibleMembers(clubId),
    fees: buildFees(clubId),
    events: buildEvents(clubId),
    notices: buildNotices(clubId),
    joinRequests,
    inviteLinks,
    reminderTargets,
    notificationLogs,
    tasks: [
      {
        id: "task-reminder",
        label: "발송 대기 알림",
        value: `${reminderTargets.reduce((sum, item) => sum + item.targetCount, 0)}명`,
        severity: reminderTargets.some((item) => item.targetCount > 0) ? "warning" : "info",
      },
      {
        id: "task-join",
        label: "가입 신청 대기",
        value: `${joinRequests.filter((request) => request.status === "pending").length}건`,
        severity: joinRequests.some((request) => request.status === "pending") ? "warning" : "info",
      },
      {
        id: "task-fee",
        label: "회비 미납자",
        value: `${dashboard.overdueMemberCount}명`,
        severity: dashboard.overdueMemberCount > 0 ? "warning" : "info",
      },
      {
        id: "task-event",
        label: "다음 일정",
        value: events[1]?.startsAt?.slice(5, 16)?.replace("T", " ") ?? "-",
        severity: "info",
      },
    ],
  };
}

export function buildMemberAppOverview(clubId: string, memberId: string): MemberAppOverview {
  const currentClub = ensureClub(clubId);
  const membership = findClubMembership(clubId, memberId);
  const member = findMember(memberId);

  return {
    club: {
      id: currentClub.id,
      name: currentClub.name,
      sportType: currentClub.sportType,
    },
    member: {
      id: member.id,
      name: member.name,
      role: membership.role,
    },
    fees: buildFees(clubId).map((fee) => ({
      id: fee.id,
      title: fee.title,
      amount: fee.amount,
      dueDate: fee.dueDate,
      status: fee.payments.find((payment) => payment.memberId === member.id)?.status ?? "unpaid",
    })),
    events: buildEvents(clubId)
      .filter((event) => {
        if (event.visibility === "all_members") {
          return true;
        }

        return membership.role === "owner" || membership.role === "operator";
      })
      .map((event) => {
        const participant = event.participants.find((item) => item.memberId === member.id);

        return {
          id: event.id,
          title: event.title,
          startsAt: event.startsAt,
          locationName: event.locationName,
          locationAddress: event.locationAddress,
          visibility: event.visibility,
          response: participant?.response ?? "not_attending",
          attendanceStatus: participant?.attendanceStatus ?? "absent",
          companionCount: participant?.companionCount ?? 0,
        };
      }),
    notices: buildNotices(clubId)
      .filter((notice) => {
        if (notice.visibility === "all_members") {
          return true;
        }

        return membership.role === "owner" || membership.role === "operator";
      })
      .map((notice) => ({
        id: notice.id,
        title: notice.title,
        body: notice.body,
        visibility: notice.visibility,
        read: notice.readers.find((reader) => reader.memberId === member.id)?.read ?? false,
        liked: noticeLikes[notice.id]?.has(member.id) ?? false,
        likeCount: notice.likeCount,
        commentCount: notice.commentCount,
        comments: notice.comments,
      })),
  };
}

export function buildMemberDirectory(clubId: string, viewerMemberId: string): MemberDirectoryItem[] {
  const viewerMembership = findClubMembership(clubId, viewerMemberId);
  const settings = ensurePrivacySettings(clubId);
  const isOperator = viewerMembership.role === "owner" || viewerMembership.role === "operator";
  const sourceMembers = isOperator ? visibleMembers(clubId) : activeMembers(clubId);

  return sourceMembers.map((member) => {
    const item: MemberDirectoryItem = {
      id: member.id,
      name: member.name,
      role: member.role,
      memberStatus: member.memberStatus,
      joinedAt: member.joinedAt,
      profileImageUrl: profileImages.get(member.id),
    };

    if (isOperator || settings.showPhoneNumberToMembers || member.id === viewerMemberId) {
      item.phoneNumber = member.phoneNumber;
    }

    if (member.birthDate && (isOperator || settings.showBirthDateToMembers || member.id === viewerMemberId)) {
      item.birthDate = member.birthDate;
    }

    if (member.gender && (isOperator || settings.showGenderToMembers || member.id === viewerMemberId)) {
      item.gender = member.gender;
    }

    return item;
  });
}

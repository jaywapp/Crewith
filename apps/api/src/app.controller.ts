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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type FeePaymentStatus = "unpaid" | "paid" | "exempt";
type FeeType = "recurring" | "one_time";
type EventResponseValue = "attending" | "not_attending";
type AttendanceStatus = "present" | "late" | "absent";
type ClubRole = "owner" | "operator" | "member";
type MemberStatus = "active" | "dormant" | "left" | "removed";
type ClubVisibility = "public" | "private";
type ResourceVisibility = "all_members" | "operators_only";
type SubscriptionStatus = "trial" | "active" | "expired" | "suspended";

interface DashboardSummary {
  totalMemberCount: number;
  activeMemberCount: number;
  overdueMemberCount: number;
  noticeReadRate: number;
  attendanceRate: number;
  attendanceConversionRate: number;
  monthlyFeeCollectionRate: number;
}

interface AdminClubOverview {
  club: {
    id: string;
    name: string;
    sportType: string;
    visibility: ClubVisibility;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt: string;
  };
  dashboard: DashboardSummary;
  members: AdminMemberListItem[];
  fees: AdminFeeListItem[];
  events: AdminEventListItem[];
  notices: AdminNoticeListItem[];
  joinRequests: AdminJoinRequestListItem[];
  inviteLinks: AdminInviteLinkListItem[];
  tasks: AdminTaskItem[];
}

interface AdminJoinRequestListItem {
  id: string;
  applicantName: string;
  applicantPhone: string;
  greeting: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface AdminInviteLinkListItem {
  id: string;
  token: string;
  expiresAt: string;
  disabled: boolean;
  createdAt: string;
}

interface AdminMemberListItem {
  id: string;
  name: string;
  phoneNumber: string;
  role: ClubRole;
  memberStatus: MemberStatus;
  joinedAt: string;
  lastFeeStatus: FeePaymentStatus;
  attendanceRate: number;
}

interface AdminFeeListItem {
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

interface AdminFeePaymentListItem {
  memberId: string;
  memberName: string;
  status: FeePaymentStatus;
}

interface AdminEventListItem {
  id: string;
  title: string;
  startsAt: string;
  locationName: string;
  locationAddress?: string;
  responseDeadline?: string;
  attendingCount: number;
  notAttendingCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  attendanceConversionRate: number;
  participants: AdminEventParticipantListItem[];
}

interface AdminEventParticipantListItem {
  memberId: string;
  memberName: string;
  response: EventResponseValue;
  attendanceStatus: AttendanceStatus;
  companionCount: number;
}

interface AdminNoticeListItem {
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

interface AdminNoticeReaderListItem {
  memberId: string;
  memberName: string;
  read: boolean;
}

interface AdminNoticeCommentListItem {
  id: string;
  memberName: string;
  body: string;
  createdAt: string;
}

interface AdminTaskItem {
  id: string;
  label: string;
  value: string;
  severity: "info" | "warning" | "danger";
}

interface MemberProfile {
  memberId: string;
  name: string;
  phoneNumber: string;
  profileImageUrl?: string;
}

interface AuthOtpRequestInput {
  phoneNumber: string;
}

interface AuthOtpVerifyInput {
  phoneNumber: string;
  code: string;
}

interface UpdateMemberProfileInput {
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

interface MvpStore {
  members: AdminMemberListItem[];
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
  profileImages: Record<string, string>;
}

interface MemberAppOverview {
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
    likeCount: number;
    commentCount: number;
  }>;
}

interface CreateAdminMemberInput {
  name: string;
  phoneNumber: string;
  role?: ClubRole;
}

interface UpdateAdminMemberInput {
  name?: string;
  phoneNumber?: string;
  role?: ClubRole;
  memberStatus?: MemberStatus;
  lastFeeStatus?: FeePaymentStatus;
}

interface CreateAdminFeeInput {
  title: string;
  feeType?: FeeType;
  amount: number;
  dueDate: string;
}

interface UpdateAdminFeePaymentInput {
  memberId: string;
  status: FeePaymentStatus;
}

interface CreateAdminEventInput {
  title: string;
  startsAt: string;
  locationName: string;
  locationAddress?: string;
  responseDeadline?: string;
}

interface UpdateAdminEventResponseInput {
  memberId: string;
  response: EventResponseValue;
}

interface UpdateAdminAttendanceInput {
  memberId: string;
  status: AttendanceStatus;
  companionCount?: number;
}

interface CreateAdminNoticeInput {
  title: string;
  body: string;
  visibility?: ResourceVisibility;
}

interface UpdateAdminNoticeReadInput {
  memberId: string;
}

interface CreateAdminNoticeCommentInput {
  memberId: string;
  body: string;
}

interface ToggleAdminNoticeReactionInput {
  memberId: string;
}

interface CreateJoinRequestInput {
  applicantName: string;
  applicantPhone: string;
  greeting: string;
}

interface ReviewJoinRequestInput {
  status: "approved" | "rejected";
}

interface CreateInviteLinkInput {
  expiresInDays?: number;
}

interface AcceptInviteInput {
  applicantName: string;
  applicantPhone: string;
}

const club = {
  id: "club-seoul-runners",
  name: "서울 러너스",
  sportType: "러닝",
  visibility: "private" as const,
  subscriptionStatus: "trial" as const,
  trialEndsAt: "2026-06-20",
};

const members: AdminMemberListItem[] = [
  {
    id: "member-01",
    name: "김민준",
    phoneNumber: "010-1234-1001",
    role: "owner",
    memberStatus: "active",
    joinedAt: "2025-11-02",
    lastFeeStatus: "paid",
    attendanceRate: 92,
  },
  {
    id: "member-02",
    name: "이서연",
    phoneNumber: "010-1234-1002",
    role: "operator",
    memberStatus: "active",
    joinedAt: "2025-12-14",
    lastFeeStatus: "paid",
    attendanceRate: 86,
  },
  {
    id: "member-03",
    name: "박도윤",
    phoneNumber: "010-1234-1003",
    role: "member",
    memberStatus: "active",
    joinedAt: "2026-01-06",
    lastFeeStatus: "unpaid",
    attendanceRate: 71,
  },
  {
    id: "member-04",
    name: "최하은",
    phoneNumber: "010-1234-1004",
    role: "member",
    memberStatus: "active",
    joinedAt: "2026-02-18",
    lastFeeStatus: "paid",
    attendanceRate: 78,
  },
  {
    id: "member-05",
    name: "정우진",
    phoneNumber: "010-1234-1005",
    role: "member",
    memberStatus: "dormant",
    joinedAt: "2026-03-09",
    lastFeeStatus: "unpaid",
    attendanceRate: 42,
  },
];

const fees: AdminFeeListItem[] = [
  {
    id: "fee-2026-05",
    title: "5월 월회비",
    feeType: "recurring",
    amount: 30000,
    dueDate: "2026-05-25",
    targetCount: 5,
    paidCount: 22,
    unpaidCount: 3,
    exemptCount: 0,
    collectionRate: 88,
    payments: [],
  },
  {
    id: "fee-event-01",
    title: "춘계 단체복 비용",
    feeType: "one_time",
    amount: 45000,
    dueDate: "2026-05-30",
    targetCount: 5,
    paidCount: 14,
    unpaidCount: 11,
    exemptCount: 0,
    collectionRate: 56,
    payments: [],
  },
];

const feePayments: Record<string, Record<string, FeePaymentStatus>> = {
  "fee-2026-05": {
    "member-01": "paid",
    "member-02": "paid",
    "member-03": "unpaid",
    "member-04": "paid",
    "member-05": "unpaid",
  },
  "fee-event-01": {
    "member-01": "paid",
    "member-02": "paid",
    "member-03": "unpaid",
    "member-04": "unpaid",
    "member-05": "unpaid",
  },
};

const events: AdminEventListItem[] = [
  {
    id: "event-01",
    title: "목요 야간 러닝",
    startsAt: "2026-05-21T20:00:00+09:00",
    locationName: "여의도 한강공원",
    locationAddress: "서울 영등포구 여의동로 330",
    responseDeadline: "2026-05-21T18:00:00+09:00",
    attendingCount: 18,
    notAttendingCount: 5,
    presentCount: 16,
    lateCount: 2,
    absentCount: 3,
    attendanceRate: 86,
    attendanceConversionRate: 100,
    participants: [],
  },
  {
    id: "event-02",
    title: "주말 장거리 훈련",
    startsAt: "2026-05-24T07:30:00+09:00",
    locationName: "서울숲",
    locationAddress: "서울 성동구 뚝섬로 273",
    responseDeadline: "2026-05-23T22:00:00+09:00",
    attendingCount: 14,
    notAttendingCount: 4,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    attendanceConversionRate: 0,
    participants: [],
  },
];

const eventResponses: Record<string, Record<string, EventResponseValue>> = {
  "event-01": {
    "member-01": "attending",
    "member-02": "attending",
    "member-03": "not_attending",
    "member-04": "attending",
    "member-05": "not_attending",
  },
  "event-02": {
    "member-01": "attending",
    "member-02": "attending",
    "member-03": "attending",
    "member-04": "not_attending",
    "member-05": "not_attending",
  },
};

const eventAttendance: Record<string, Record<string, { status: AttendanceStatus; companionCount: number }>> = {
  "event-01": {
    "member-01": { status: "present", companionCount: 0 },
    "member-02": { status: "late", companionCount: 1 },
    "member-03": { status: "absent", companionCount: 0 },
    "member-04": { status: "present", companionCount: 0 },
    "member-05": { status: "absent", companionCount: 0 },
  },
  "event-02": {},
};

const notices: AdminNoticeListItem[] = [
  {
    id: "notice-01",
    title: "5월 회비 납부 안내",
    body: "5월 월회비 납부일은 5월 25일입니다. 미납자는 운영진에게 입금 확인을 요청해주세요.",
    visibility: "all_members",
    createdAt: "2026-05-18T09:00:00+09:00",
    readCount: 21,
    unreadCount: 4,
    likeCount: 9,
    commentCount: 3,
    readers: [],
    comments: [],
  },
  {
    id: "notice-02",
    title: "운영진 회의 안건",
    body: "신규 회원 승인 기준과 6월 훈련 장소 후보를 논의합니다.",
    visibility: "operators_only",
    createdAt: "2026-05-19T21:30:00+09:00",
    readCount: 2,
    unreadCount: 1,
    likeCount: 1,
    commentCount: 2,
    readers: [],
    comments: [],
  },
];

const noticeReads: Record<string, Set<string>> = {
  "notice-01": new Set(["member-01", "member-02", "member-04"]),
  "notice-02": new Set(["member-01", "member-02"]),
};

const noticeLikes: Record<string, Set<string>> = {
  "notice-01": new Set(["member-01", "member-02"]),
  "notice-02": new Set(["member-01"]),
};

const noticeComments: Record<string, AdminNoticeCommentListItem[]> = {
  "notice-01": [
    {
      id: "comment-01",
      memberName: "이서연",
      body: "입금 확인했습니다.",
      createdAt: "2026-05-18T10:20:00+09:00",
    },
  ],
  "notice-02": [
    {
      id: "comment-02",
      memberName: "김민준",
      body: "장소 후보를 두 군데로 좁혀보겠습니다.",
      createdAt: "2026-05-19T22:00:00+09:00",
    },
  ],
};

const joinRequests: AdminJoinRequestListItem[] = [
  {
    id: "join-01",
    applicantName: "한지우",
    applicantPhone: "010-5555-1001",
    greeting: "러닝을 꾸준히 해보고 싶어 가입 신청합니다.",
    status: "pending",
    createdAt: "2026-05-20T19:30:00+09:00",
  },
  {
    id: "join-02",
    applicantName: "오서준",
    applicantPhone: "010-5555-1002",
    greeting: "친구 추천으로 신청합니다.",
    status: "pending",
    createdAt: "2026-05-20T21:10:00+09:00",
  },
];

const inviteLinks: AdminInviteLinkListItem[] = [
  {
    id: "invite-01",
    token: "CREWITH-RUN-30",
    expiresAt: "2026-06-19",
    disabled: false,
    createdAt: "2026-05-20T20:00:00+09:00",
  },
];

const otpCodes = new Map<string, { code: string; expiresAt: string }>();
const profileImages = new Map<string, string>();
const dataFilePath = process.env.CREWITH_DATA_FILE ?? join(process.cwd(), "data", "mvp-store.json");

function replaceArray<T>(target: T[], next: T[] | undefined) {
  if (!Array.isArray(next)) {
    return;
  }

  target.splice(0, target.length, ...next);
}

function replaceRecord<T>(target: Record<string, T>, next: Record<string, T> | undefined) {
  if (!next || typeof next !== "object") {
    return;
  }

  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, next);
}

function serializeSetRecord(source: Record<string, Set<string>>) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, [...value]]));
}

function hydrateSetRecord(target: Record<string, Set<string>>, source: Record<string, string[]> | undefined) {
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

function persistStore() {
  const store: MvpStore = {
    members,
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
    profileImages: Object.fromEntries(profileImages),
  };

  mkdirSync(dirname(dataFilePath), { recursive: true });
  writeFileSync(dataFilePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function hydrateStore() {
  if (!existsSync(dataFilePath)) {
    persistStore();
    return;
  }

  const store = JSON.parse(readFileSync(dataFilePath, "utf8")) as Partial<MvpStore>;

  replaceArray(members, store.members);
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
  profileImages.clear();

  for (const [memberId, imageUrl] of Object.entries(store.profileImages ?? {})) {
    profileImages.set(memberId, imageUrl);
  }
}

function normalizePhoneNumber(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function buildProfile(member: AdminMemberListItem): MemberProfile {
  return {
    memberId: member.id,
    name: member.name,
    phoneNumber: member.phoneNumber,
    profileImageUrl: profileImages.get(member.id),
  };
}

function initializeMemberState(member: AdminMemberListItem) {
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

function createMemberFromProfile(name: string, phoneNumber: string): AdminMemberListItem {
  const nextMember: AdminMemberListItem = {
    id: `member-${Date.now()}`,
    name,
    phoneNumber,
    role: "member",
    memberStatus: "active",
    joinedAt: new Date().toISOString().slice(0, 10),
    lastFeeStatus: "unpaid",
    attendanceRate: 0,
  };

  members.push(nextMember);
  initializeMemberState(nextMember);
  return nextMember;
}

hydrateStore();

function activeMembers() {
  return members.filter((member) => member.memberStatus === "active");
}

function visibleMembers() {
  return members.filter((member) => member.memberStatus !== "removed");
}

function findMember(memberId: string) {
  const member = members.find((item) => item.id === memberId);

  if (!member) {
    throw new NotFoundException("Member not found");
  }

  return member;
}

function findFee(feeId: string) {
  const fee = fees.find((item) => item.id === feeId);

  if (!fee) {
    throw new NotFoundException("Fee not found");
  }

  return fee;
}

function findEvent(eventId: string) {
  const event = events.find((item) => item.id === eventId);

  if (!event) {
    throw new NotFoundException("Event not found");
  }

  return event;
}

function findNotice(noticeId: string) {
  const notice = notices.find((item) => item.id === noticeId);

  if (!notice) {
    throw new NotFoundException("Notice not found");
  }

  return notice;
}

function findJoinRequest(requestId: string) {
  const request = joinRequests.find((item) => item.id === requestId);

  if (!request) {
    throw new NotFoundException("Join request not found");
  }

  return request;
}

function findInviteByToken(token: string) {
  const invite = inviteLinks.find((item) => item.token === token && !item.disabled);

  if (!invite) {
    throw new NotFoundException("Invite link not found");
  }

  return invite;
}

function isClubRole(value: unknown): value is ClubRole {
  return value === "owner" || value === "operator" || value === "member";
}

function isMemberStatus(value: unknown): value is MemberStatus {
  return value === "active" || value === "dormant" || value === "left" || value === "removed";
}

function isFeePaymentStatus(value: unknown): value is FeePaymentStatus {
  return value === "unpaid" || value === "paid" || value === "exempt";
}

function isFeeType(value: unknown): value is FeeType {
  return value === "recurring" || value === "one_time";
}

function isEventResponse(value: unknown): value is EventResponseValue {
  return value === "attending" || value === "not_attending";
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === "present" || value === "late" || value === "absent";
}

function isResourceVisibility(value: unknown): value is ResourceVisibility {
  return value === "all_members" || value === "operators_only";
}

function buildFeeItem(fee: AdminFeeListItem): AdminFeeListItem {
  const payments = feePayments[fee.id] ?? {};
  const targetMembers = activeMembers();
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

function buildFees() {
  return fees.map((fee) => buildFeeItem(fee));
}

function ensureFeeTargets(feeId: string) {
  feePayments[feeId] ??= {};

  for (const member of activeMembers()) {
    feePayments[feeId][member.id] ??= "unpaid";
  }
}

function ensureEventTargets(eventId: string) {
  eventResponses[eventId] ??= {};
  eventAttendance[eventId] ??= {};

  for (const member of activeMembers()) {
    eventResponses[eventId][member.id] ??= "not_attending";
    eventAttendance[eventId][member.id] ??= { status: "absent", companionCount: 0 };
  }
}

function buildEventItem(event: AdminEventListItem): AdminEventListItem {
  ensureEventTargets(event.id);

  const targetMembers = activeMembers();
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

function buildEvents() {
  return events.map((event) => buildEventItem(event));
}

function noticeTargetMembers(notice: AdminNoticeListItem) {
  const targetMembers = activeMembers();

  if (notice.visibility === "operators_only") {
    return targetMembers.filter((member) => member.role === "owner" || member.role === "operator");
  }

  return targetMembers;
}

function buildNoticeItem(notice: AdminNoticeListItem): AdminNoticeListItem {
  noticeReads[notice.id] ??= new Set();
  noticeLikes[notice.id] ??= new Set();
  noticeComments[notice.id] ??= [];

  const targetMembers = noticeTargetMembers(notice);
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

function buildNotices() {
  return notices.map((notice) => buildNoticeItem(notice));
}

function buildDashboard(): DashboardSummary {
  const totalMemberCount = visibleMembers().length;
  const activeMemberCount = activeMembers().length;
  const monthlyFee = buildFeeItem(fees[0]);
  const overdueMemberCount = monthlyFee.unpaidCount;
  const latestEvent = buildEventItem(events[0]);
  const latestNotice = buildNoticeItem(notices[0]);

  return {
    totalMemberCount,
    activeMemberCount,
    overdueMemberCount,
    noticeReadRate:
      latestNotice.readCount + latestNotice.unreadCount === 0
        ? 100
        : Math.round((latestNotice.readCount / (latestNotice.readCount + latestNotice.unreadCount)) * 100),
    attendanceRate: latestEvent.attendanceRate,
    attendanceConversionRate: latestEvent.attendanceConversionRate,
    monthlyFeeCollectionRate: monthlyFee.collectionRate,
  };
}

function buildOverview(): AdminClubOverview {
  const dashboard = buildDashboard();

  return {
    club,
    dashboard,
    members: visibleMembers(),
    fees: buildFees(),
    events: buildEvents(),
    notices: buildNotices(),
    joinRequests,
    inviteLinks,
    tasks: [
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
        value: events[1].startsAt.slice(5, 16).replace("T", " "),
        severity: "info",
      },
    ],
  };
}

function buildMemberAppOverview(memberId: string): MemberAppOverview {
  const member = findMember(memberId);

  return {
    club: {
      id: club.id,
      name: club.name,
      sportType: club.sportType,
    },
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
    },
    fees: buildFees().map((fee) => ({
      id: fee.id,
      title: fee.title,
      amount: fee.amount,
      dueDate: fee.dueDate,
      status: fee.payments.find((payment) => payment.memberId === member.id)?.status ?? "unpaid",
    })),
    events: buildEvents().map((event) => {
      const participant = event.participants.find((item) => item.memberId === member.id);

      return {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        locationName: event.locationName,
        locationAddress: event.locationAddress,
        response: participant?.response ?? "not_attending",
        attendanceStatus: participant?.attendanceStatus ?? "absent",
        companionCount: participant?.companionCount ?? 0,
      };
    }),
    notices: buildNotices()
      .filter((notice) => {
        if (notice.visibility === "all_members") {
          return true;
        }

        return member.role === "owner" || member.role === "operator";
      })
      .map((notice) => ({
        id: notice.id,
        title: notice.title,
        body: notice.body,
        visibility: notice.visibility,
        read: notice.readers.find((reader) => reader.memberId === member.id)?.read ?? false,
        likeCount: notice.likeCount,
        commentCount: notice.commentCount,
      })),
  };
}

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

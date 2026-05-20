import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

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
  tasks: AdminTaskItem[];
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
    tasks: [
      {
        id: "task-join",
        label: "가입 신청 대기",
        value: "2건",
        severity: "info",
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
    for (const fee of fees) {
      feePayments[fee.id] ??= {};
      feePayments[fee.id][nextMember.id] = "unpaid";
    }
    for (const event of events) {
      eventResponses[event.id] ??= {};
      eventAttendance[event.id] ??= {};
      eventResponses[event.id][nextMember.id] = "not_attending";
      eventAttendance[event.id][nextMember.id] = { status: "absent", companionCount: 0 };
    }
    for (const notice of notices) {
      if (notice.visibility === "all_members") {
        noticeReads[notice.id] ??= new Set();
      }
    }

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

    return {
      data: member,
    };
  }

  @Delete("clubs/:clubId/members/:memberId")
  removeMember(@Param("memberId") memberId: string) {
    const member = findMember(memberId);
    member.memberStatus = "removed";

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

    return {
      data: buildNoticeItem(notice),
    };
  }
}

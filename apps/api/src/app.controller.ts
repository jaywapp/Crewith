import { Body, Controller, Get, Param, Patch } from "@nestjs/common";

type FeePaymentStatus = "unpaid" | "paid" | "exempt";
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
  amount: number;
  dueDate: string;
  paidCount: number;
  unpaidCount: number;
  collectionRate: number;
}

interface AdminEventListItem {
  id: string;
  title: string;
  startsAt: string;
  locationName: string;
  attendingCount: number;
  notAttendingCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
}

interface AdminNoticeListItem {
  id: string;
  title: string;
  visibility: ResourceVisibility;
  createdAt: string;
  readCount: number;
  unreadCount: number;
  likeCount: number;
  commentCount: number;
}

interface AdminTaskItem {
  id: string;
  label: string;
  value: string;
  severity: "info" | "warning" | "danger";
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
    amount: 30000,
    dueDate: "2026-05-25",
    paidCount: 22,
    unpaidCount: 3,
    collectionRate: 88,
  },
  {
    id: "fee-event-01",
    title: "춘계 단체복 비용",
    amount: 45000,
    dueDate: "2026-05-30",
    paidCount: 14,
    unpaidCount: 11,
    collectionRate: 56,
  },
];

const events: AdminEventListItem[] = [
  {
    id: "event-01",
    title: "목요 야간 러닝",
    startsAt: "2026-05-21T20:00:00+09:00",
    locationName: "여의도 한강공원",
    attendingCount: 18,
    notAttendingCount: 5,
    presentCount: 16,
    lateCount: 2,
    absentCount: 3,
  },
  {
    id: "event-02",
    title: "주말 장거리 훈련",
    startsAt: "2026-05-24T07:30:00+09:00",
    locationName: "서울숲",
    attendingCount: 14,
    notAttendingCount: 4,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
  },
];

const notices: AdminNoticeListItem[] = [
  {
    id: "notice-01",
    title: "5월 회비 납부 안내",
    visibility: "all_members",
    createdAt: "2026-05-18T09:00:00+09:00",
    readCount: 21,
    unreadCount: 4,
    likeCount: 9,
    commentCount: 3,
  },
  {
    id: "notice-02",
    title: "운영진 회의 안건",
    visibility: "operators_only",
    createdAt: "2026-05-19T21:30:00+09:00",
    readCount: 2,
    unreadCount: 1,
    likeCount: 1,
    commentCount: 2,
  },
];

function buildDashboard(): DashboardSummary {
  const totalMemberCount = 28;
  const activeMemberCount = 25;
  const overdueMemberCount = members.filter((member) => member.lastFeeStatus === "unpaid").length;
  const latestEvent = events[0];
  const latestNotice = notices[0];

  return {
    totalMemberCount,
    activeMemberCount,
    overdueMemberCount,
    noticeReadRate: Math.round((latestNotice.readCount / (latestNotice.readCount + latestNotice.unreadCount)) * 100),
    attendanceRate: Math.round(
      ((latestEvent.presentCount + latestEvent.lateCount) /
        (latestEvent.presentCount + latestEvent.lateCount + latestEvent.absentCount)) *
        100,
    ),
    attendanceConversionRate: Math.round(
      ((latestEvent.presentCount + latestEvent.lateCount) / latestEvent.attendingCount) * 100,
    ),
    monthlyFeeCollectionRate: fees[0].collectionRate,
  };
}

function buildOverview(): AdminClubOverview {
  const dashboard = buildDashboard();

  return {
    club,
    dashboard,
    members,
    fees,
    events,
    notices,
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

  @Patch("clubs/:clubId/members/:memberId/fee-status")
  updateMemberFeeStatus(
    @Param("memberId") memberId: string,
    @Body("status") status: FeePaymentStatus,
  ) {
    const member = members.find((item) => item.id === memberId);

    if (member && ["unpaid", "paid", "exempt"].includes(status)) {
      member.lastFeeStatus = status;
    }

    return {
      data: member,
    };
  }

  @Patch("clubs/:clubId/events/:eventId/attendance")
  updateEventAttendance(
    @Param("eventId") eventId: string,
    @Body("status") status: AttendanceStatus,
  ) {
    const event = events.find((item) => item.id === eventId);

    if (event && ["present", "late", "absent"].includes(status)) {
      event.presentCount = status === "present" ? event.presentCount + 1 : event.presentCount;
      event.lateCount = status === "late" ? event.lateCount + 1 : event.lateCount;
      event.absentCount = status === "absent" ? event.absentCount + 1 : event.absentCount;
    }

    return {
      data: event,
    };
  }

  @Patch("clubs/:clubId/notices/:noticeId/read")
  markNoticeRead(@Param("noticeId") noticeId: string) {
    const notice = notices.find((item) => item.id === noticeId);

    if (notice && notice.unreadCount > 0) {
      notice.readCount += 1;
      notice.unreadCount -= 1;
    }

    return {
      data: notice,
    };
  }
}

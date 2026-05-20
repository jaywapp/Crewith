import type { AdminClubOverview, ApiEnvelope } from "@crewith/shared-types";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";
const clubId = "club-seoul-runners";

const fallbackOverview: AdminClubOverview = {
  club: {
    id: clubId,
    name: "서울 러너스",
    sportType: "러닝",
    visibility: "private",
    subscriptionStatus: "trial",
    trialEndsAt: "2026-06-20",
  },
  dashboard: {
    totalMemberCount: 28,
    activeMemberCount: 25,
    overdueMemberCount: 3,
    noticeReadRate: 84,
    attendanceRate: 86,
    attendanceConversionRate: 100,
    monthlyFeeCollectionRate: 88,
  },
  members: [
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
  ],
  fees: [
    {
      id: "fee-2026-05",
      title: "5월 월회비",
      amount: 30000,
      dueDate: "2026-05-25",
      paidCount: 22,
      unpaidCount: 3,
      collectionRate: 88,
    },
  ],
  events: [
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
  ],
  notices: [
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
  ],
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
      value: "3명",
      severity: "warning",
    },
  ],
};

const navItems = ["대시보드", "구성원", "회비", "일정", "공지", "가입/초대", "통계", "설정"];

async function getOverview() {
  try {
    const response = await fetch(`${apiBaseUrl}/clubs/${clubId}/admin/overview`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return fallbackOverview;
    }

    const envelope = (await response.json()) as ApiEnvelope<AdminClubOverview>;
    return envelope.data;
  } catch {
    return fallbackOverview;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function roleLabel(role: string) {
  return {
    owner: "모임장",
    operator: "운영진",
    member: "일반회원",
  }[role];
}

function feeStatusLabel(status: string) {
  return {
    paid: "납부",
    unpaid: "미납",
    exempt: "면제",
  }[status];
}

export default async function AdminHome() {
  const overview = await getOverview();
  const metrics = [
    ["전체 회원", `${overview.dashboard.totalMemberCount}명`],
    ["활성 회원", `${overview.dashboard.activeMemberCount}명`],
    ["회비 미납", `${overview.dashboard.overdueMemberCount}명`],
    ["공지 확인률", `${overview.dashboard.noticeReadRate}%`],
    ["실제 출석률", `${overview.dashboard.attendanceRate}%`],
    ["월 회비 수납률", `${overview.dashboard.monthlyFeeCollectionRate}%`],
  ];

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">Crewith</div>
        <nav>
          {navItems.map((item) => (
            <a key={item} className={item === "대시보드" ? "active" : ""} href="#">
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {overview.club.sportType} 모임 · {overview.club.visibility === "private" ? "비공개" : "공개"}
            </p>
            <h1>{overview.club.name} 운영 대시보드</h1>
          </div>
          <div className="actions">
            <button className="secondary">일정 생성</button>
            <button className="primary">공지 작성</button>
          </div>
        </header>

        <section className="metrics" aria-label="운영 지표">
          {metrics.map(([label, value]) => (
            <article key={label} className="metric">
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="grid">
          <article className="panel">
            <div className="panelHeader">
              <h2>오늘의 작업</h2>
              <a href="#">전체 보기</a>
            </div>
            <ul className="taskList">
              {overview.tasks.map((task) => (
                <li key={task.id}>
                  <span>{task.label}</span>
                  <strong className={`taskValue ${task.severity}`}>{task.value}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel dark">
            <p className="eyebrow">무료 체험</p>
            <h2>30일 체험이 진행 중입니다.</h2>
            <p>체험 종료일은 {overview.club.trialEndsAt}입니다. 실제 결제 연동 전까지 구독 상태만 표시합니다.</p>
          </article>
        </section>

        <section className="operations">
          <article className="panel">
            <div className="panelHeader">
              <h2>구성원</h2>
              <a href="#">회원 관리</a>
            </div>
            <div className="table">
              {overview.members.map((member) => (
                <div className="tableRow" key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.phoneNumber}</span>
                  </div>
                  <span>{roleLabel(member.role)}</span>
                  <span className={`status ${member.lastFeeStatus}`}>{feeStatusLabel(member.lastFeeStatus)}</span>
                  <span>{member.attendanceRate}%</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <h2>회비</h2>
              <a href="#">납부 관리</a>
            </div>
            {overview.fees.map((fee) => (
              <div className="summaryLine" key={fee.id}>
                <div>
                  <strong>{fee.title}</strong>
                  <span>
                    {formatCurrency(fee.amount)}원 · {fee.dueDate}까지
                  </span>
                </div>
                <strong>{fee.collectionRate}%</strong>
              </div>
            ))}
          </article>

          <article className="panel">
            <div className="panelHeader">
              <h2>일정</h2>
              <a href="#">출석부</a>
            </div>
            {overview.events.map((event) => (
              <div className="summaryLine" key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <span>
                    {formatDate(event.startsAt)} · {event.locationName}
                  </span>
                </div>
                <strong>{event.presentCount + event.lateCount}명</strong>
              </div>
            ))}
          </article>

          <article className="panel">
            <div className="panelHeader">
              <h2>공지</h2>
              <a href="#">공지 관리</a>
            </div>
            {overview.notices.map((notice) => (
              <div className="summaryLine" key={notice.id}>
                <div>
                  <strong>{notice.title}</strong>
                  <span>
                    확인 {notice.readCount}명 · 미확인 {notice.unreadCount}명 · 댓글 {notice.commentCount}개
                  </span>
                </div>
                <strong>{notice.likeCount}</strong>
              </div>
            ))}
          </article>
        </section>
      </section>
    </main>
  );
}

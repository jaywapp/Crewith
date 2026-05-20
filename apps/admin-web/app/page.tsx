import type {
  AdminClubOverview,
  ApiEnvelope,
  ClubRole,
  FeeStatus,
  MemberStatus,
} from "@crewith/shared-types";
import { revalidatePath } from "next/cache";

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
    totalMemberCount: 5,
    activeMemberCount: 4,
    overdueMemberCount: 2,
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
      feeType: "recurring",
      amount: 30000,
      dueDate: "2026-05-25",
      targetCount: 3,
      paidCount: 22,
      unpaidCount: 3,
      exemptCount: 0,
      collectionRate: 88,
      payments: [
        { memberId: "member-01", memberName: "김민준", status: "paid" },
        { memberId: "member-02", memberName: "이서연", status: "paid" },
        { memberId: "member-03", memberName: "박도윤", status: "unpaid" },
      ],
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
      value: "2명",
      severity: "warning",
    },
  ],
};

const navItems = ["대시보드", "구성원", "회비", "일정", "공지", "가입/초대", "통계", "설정"];

const roleLabels: Record<ClubRole, string> = {
  owner: "모임장",
  operator: "운영진",
  member: "일반회원",
};

const memberStatusLabels: Record<MemberStatus, string> = {
  active: "활성",
  dormant: "휴면",
  left: "탈퇴",
  removed: "삭제",
};

const feeStatusLabels: Record<FeeStatus, string> = {
  paid: "납부",
  unpaid: "미납",
  exempt: "면제",
};

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

async function createMemberAction(formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      role: formData.get("role"),
    }),
  });

  revalidatePath("/");
}

async function updateMemberAction(memberId: string, formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/members/${memberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: formData.get("role"),
      memberStatus: formData.get("memberStatus"),
      lastFeeStatus: formData.get("lastFeeStatus"),
    }),
  });

  revalidatePath("/");
}

async function removeMemberAction(memberId: string) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/members/${memberId}`, {
    method: "DELETE",
  });

  revalidatePath("/");
}

async function createFeeAction(formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/fees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: formData.get("title"),
      feeType: formData.get("feeType"),
      amount: Number(formData.get("amount")),
      dueDate: formData.get("dueDate"),
    }),
  });

  revalidatePath("/");
}

async function updateFeePaymentAction(feeId: string, formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/fees/${feeId}/payments`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      status: formData.get("status"),
    }),
  });

  revalidatePath("/");
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

        <section className="memberWorkspace">
          <article className="panel memberEditor">
            <div className="panelHeader">
              <h2>구성원 관리</h2>
              <a href="#">회원 {overview.members.length}명</a>
            </div>

            <form action={createMemberAction} className="memberCreateForm">
              <label>
                이름
                <input name="name" placeholder="홍길동" required />
              </label>
              <label>
                휴대폰 번호
                <input name="phoneNumber" placeholder="010-0000-0000" required />
              </label>
              <label>
                역할
                <select name="role" defaultValue="member">
                  <option value="member">일반회원</option>
                  <option value="operator">운영진</option>
                  <option value="owner">모임장</option>
                </select>
              </label>
              <button className="primary" type="submit">
                회원 추가
              </button>
            </form>

            <div className="memberRows">
              {overview.members.map((member) => (
                <form action={updateMemberAction.bind(null, member.id)} className="memberRow" key={member.id}>
                  <div className="memberIdentity">
                    <strong>{member.name}</strong>
                    <span>
                      {member.phoneNumber} · 가입 {member.joinedAt}
                    </span>
                  </div>
                  <label>
                    역할
                    <select name="role" defaultValue={member.role}>
                      <option value="owner">모임장</option>
                      <option value="operator">운영진</option>
                      <option value="member">일반회원</option>
                    </select>
                  </label>
                  <label>
                    상태
                    <select name="memberStatus" defaultValue={member.memberStatus}>
                      <option value="active">활성</option>
                      <option value="dormant">휴면</option>
                      <option value="left">탈퇴</option>
                    </select>
                  </label>
                  <label>
                    회비
                    <select name="lastFeeStatus" defaultValue={member.lastFeeStatus}>
                      <option value="paid">납부</option>
                      <option value="unpaid">미납</option>
                      <option value="exempt">면제</option>
                    </select>
                  </label>
                  <span className={`status ${member.lastFeeStatus}`}>{feeStatusLabels[member.lastFeeStatus]}</span>
                  <button className="secondary compact" type="submit">
                    저장
                  </button>
                  <button className="danger compact" formAction={removeMemberAction.bind(null, member.id)}>
                    삭제
                  </button>
                </form>
              ))}
            </div>
          </article>

          <aside className="memberAside">
            <article className="panel">
              <div className="panelHeader">
                <h2>회비 관리</h2>
                <a href="#">납부율 {overview.dashboard.monthlyFeeCollectionRate}%</a>
              </div>
              <form action={createFeeAction} className="feeCreateForm">
                <label>
                  항목명
                  <input name="title" placeholder="6월 월회비" required />
                </label>
                <label>
                  유형
                  <select name="feeType" defaultValue="recurring">
                    <option value="recurring">월회비</option>
                    <option value="one_time">일회성</option>
                  </select>
                </label>
                <label>
                  금액
                  <input name="amount" min="0" placeholder="30000" required type="number" />
                </label>
                <label>
                  납부일
                  <input name="dueDate" required type="date" />
                </label>
                <button className="primary compact" type="submit">
                  추가
                </button>
              </form>
              {overview.fees.map((fee) => (
                <div className="feeBlock" key={fee.id}>
                  <div className="summaryLine">
                    <div>
                      <strong>{fee.title}</strong>
                      <span>
                        {fee.feeType === "recurring" ? "월회비" : "일회성"} · {formatCurrency(fee.amount)}원 · {fee.dueDate}까지
                      </span>
                    </div>
                    <strong>{fee.collectionRate}%</strong>
                  </div>
                  <div className="feeMeta">
                    <span>대상 {fee.targetCount}명</span>
                    <span>납부 {fee.paidCount}명</span>
                    <span>미납 {fee.unpaidCount}명</span>
                    <span>면제 {fee.exemptCount}명</span>
                  </div>
                  <div className="feePaymentRows">
                    {fee.payments.map((payment) => (
                      <form
                        action={updateFeePaymentAction.bind(null, fee.id)}
                        className="feePaymentRow"
                        key={`${fee.id}-${payment.memberId}`}
                      >
                        <input name="memberId" type="hidden" value={payment.memberId} />
                        <span>{payment.memberName}</span>
                        <select name="status" defaultValue={payment.status}>
                          <option value="paid">납부</option>
                          <option value="unpaid">미납</option>
                          <option value="exempt">면제</option>
                        </select>
                        <button className="secondary compact" type="submit">
                          저장
                        </button>
                      </form>
                    ))}
                  </div>
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
          </aside>
        </section>
      </section>
    </main>
  );
}

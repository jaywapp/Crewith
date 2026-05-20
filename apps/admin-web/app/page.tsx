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
      locationAddress: "서울 영등포구 여의동로 330",
      responseDeadline: "2026-05-21T18:00:00+09:00",
      attendingCount: 18,
      notAttendingCount: 5,
      presentCount: 16,
      lateCount: 2,
      absentCount: 3,
      attendanceRate: 86,
      attendanceConversionRate: 100,
      participants: [
        { memberId: "member-01", memberName: "김민준", response: "attending", attendanceStatus: "present", companionCount: 0 },
        { memberId: "member-02", memberName: "이서연", response: "attending", attendanceStatus: "late", companionCount: 1 },
        { memberId: "member-03", memberName: "박도윤", response: "not_attending", attendanceStatus: "absent", companionCount: 0 },
      ],
    },
  ],
  notices: [
    {
      id: "notice-01",
      title: "5월 회비 납부 안내",
      body: "5월 월회비 납부일은 5월 25일입니다.",
      visibility: "all_members",
      createdAt: "2026-05-18T09:00:00+09:00",
      readCount: 21,
      unreadCount: 4,
      likeCount: 9,
      commentCount: 3,
      readers: [
        { memberId: "member-01", memberName: "김민준", read: true },
        { memberId: "member-02", memberName: "이서연", read: true },
        { memberId: "member-03", memberName: "박도윤", read: false },
      ],
      comments: [
        { id: "comment-01", memberName: "이서연", body: "입금 확인했습니다.", createdAt: "2026-05-18T10:20:00+09:00" },
      ],
    },
  ],
  joinRequests: [
    {
      id: "join-01",
      applicantName: "한지우",
      applicantPhone: "010-5555-1001",
      greeting: "러닝을 꾸준히 해보고 싶어 가입 신청합니다.",
      status: "pending",
      createdAt: "2026-05-20T19:30:00+09:00",
    },
  ],
  inviteLinks: [
    {
      id: "invite-01",
      token: "CREWITH-RUN-30",
      expiresAt: "2026-06-19",
      disabled: false,
      createdAt: "2026-05-20T20:00:00+09:00",
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

async function reviewJoinRequestAction(requestId: string, status: "approved" | "rejected") {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/join-requests/${requestId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  revalidatePath("/");
}

async function createInviteLinkAction(formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/invite-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expiresInDays: Number(formData.get("expiresInDays")),
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

async function createEventAction(formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: formData.get("title"),
      startsAt: formData.get("startsAt"),
      locationName: formData.get("locationName"),
      locationAddress: formData.get("locationAddress"),
      responseDeadline: formData.get("responseDeadline"),
    }),
  });

  revalidatePath("/");
}

async function updateEventResponseAction(eventId: string, formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/events/${eventId}/responses`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      response: formData.get("response"),
    }),
  });

  revalidatePath("/");
}

async function updateAttendanceAction(eventId: string, formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/events/${eventId}/attendance`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      status: formData.get("status"),
      companionCount: Number(formData.get("companionCount")),
    }),
  });

  revalidatePath("/");
}

async function createNoticeAction(formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: formData.get("title"),
      body: formData.get("body"),
      visibility: formData.get("visibility"),
    }),
  });

  revalidatePath("/");
}

async function markNoticeReadAction(noticeId: string, formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices/${noticeId}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId: formData.get("memberId"),
    }),
  });

  revalidatePath("/");
}

async function toggleNoticeReactionAction(noticeId: string, formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices/${noticeId}/reactions`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId: formData.get("memberId"),
    }),
  });

  revalidatePath("/");
}

async function createNoticeCommentAction(noticeId: string, formData: FormData) {
  "use server";

  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices/${noticeId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      body: formData.get("body"),
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

            <section className="joinSection">
              <div className="panelHeader">
                <h2>가입/초대</h2>
                <a href="#">대기 {overview.joinRequests.filter((request) => request.status === "pending").length}건</a>
              </div>
              <form action={createInviteLinkAction} className="inviteCreateForm">
                <label>
                  초대 만료일
                  <select name="expiresInDays" defaultValue="30">
                    <option value="7">7일</option>
                    <option value="30">30일</option>
                    <option value="90">90일</option>
                  </select>
                </label>
                <button className="primary compact" type="submit">
                  초대 링크 생성
                </button>
              </form>
              <div className="inviteRows">
                {overview.inviteLinks.map((invite) => (
                  <div className="inviteRow" key={invite.id}>
                    <strong>{invite.token}</strong>
                    <span>{invite.expiresAt}까지</span>
                  </div>
                ))}
              </div>
              <div className="joinRows">
                {overview.joinRequests.map((request) => (
                  <div className="joinRow" key={request.id}>
                    <div>
                      <strong>{request.applicantName}</strong>
                      <span>{request.applicantPhone}</span>
                      <p>{request.greeting}</p>
                    </div>
                    <strong className={`joinStatus ${request.status}`}>{request.status}</strong>
                    <form action={reviewJoinRequestAction.bind(null, request.id, "approved")}>
                      <button className="secondary compact" type="submit">
                        승인
                      </button>
                    </form>
                    <form action={reviewJoinRequestAction.bind(null, request.id, "rejected")}>
                      <button className="danger compact" type="submit">
                        거절
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
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
                <h2>일정/출석</h2>
                <a href="#">참석 대비 {overview.dashboard.attendanceConversionRate}%</a>
              </div>
              <form action={createEventAction} className="eventCreateForm">
                <label>
                  일정명
                  <input name="title" placeholder="주말 정기 모임" required />
                </label>
                <label>
                  일시
                  <input name="startsAt" required type="datetime-local" />
                </label>
                <label>
                  장소
                  <input name="locationName" placeholder="서울숲" required />
                </label>
                <label>
                  주소
                  <input name="locationAddress" placeholder="지도 연동 전 주소 입력" />
                </label>
                <label>
                  응답 마감
                  <input name="responseDeadline" type="datetime-local" />
                </label>
                <button className="primary compact" type="submit">
                  추가
                </button>
              </form>
              {overview.events.map((event) => (
                <div className="eventBlock" key={event.id}>
                  <div className="summaryLine">
                    <div>
                      <strong>{event.title}</strong>
                      <span>
                        {formatDate(event.startsAt)} · {event.locationName}
                      </span>
                    </div>
                    <strong>{event.presentCount + event.lateCount}명</strong>
                  </div>
                  <div className="feeMeta">
                    <span>참석 {event.attendingCount}명</span>
                    <span>불참 {event.notAttendingCount}명</span>
                    <span>출석 {event.presentCount}명</span>
                    <span>지각 {event.lateCount}명</span>
                    <span>결석 {event.absentCount}명</span>
                  </div>
                  <div className="eventParticipantRows">
                    {event.participants.map((participant) => (
                      <div className="eventParticipantRow" key={`${event.id}-${participant.memberId}`}>
                        <strong>{participant.memberName}</strong>
                        <form action={updateEventResponseAction.bind(null, event.id)}>
                          <input name="memberId" type="hidden" value={participant.memberId} />
                          <select name="response" defaultValue={participant.response}>
                            <option value="attending">참석 예정</option>
                            <option value="not_attending">불참 예정</option>
                          </select>
                          <button className="secondary compact" type="submit">
                            저장
                          </button>
                        </form>
                        <form action={updateAttendanceAction.bind(null, event.id)}>
                          <input name="memberId" type="hidden" value={participant.memberId} />
                          <select name="status" defaultValue={participant.attendanceStatus}>
                            <option value="present">출석</option>
                            <option value="late">지각</option>
                            <option value="absent">결석</option>
                          </select>
                          <input min="0" name="companionCount" type="number" defaultValue={participant.companionCount} />
                          <button className="secondary compact" type="submit">
                            저장
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </article>

            <article className="panel">
              <div className="panelHeader">
                <h2>공지 관리</h2>
                <a href="#">확인률 {overview.dashboard.noticeReadRate}%</a>
              </div>
              <form action={createNoticeAction} className="noticeCreateForm">
                <label>
                  제목
                  <input name="title" placeholder="공지 제목" required />
                </label>
                <label>
                  권한
                  <select name="visibility" defaultValue="all_members">
                    <option value="all_members">전체 회원</option>
                    <option value="operators_only">운영진만</option>
                  </select>
                </label>
                <label className="wideField">
                  내용
                  <textarea name="body" placeholder="공지 내용을 입력하세요." required />
                </label>
                <button className="primary compact" type="submit">
                  작성
                </button>
              </form>
              {overview.notices.map((notice) => (
                <div className="noticeBlock" key={notice.id}>
                  <div className="summaryLine">
                    <div>
                      <strong>{notice.title}</strong>
                      <span>
                        {notice.visibility === "operators_only" ? "운영진만" : "전체 회원"} · 확인 {notice.readCount}명 · 미확인{" "}
                        {notice.unreadCount}명
                      </span>
                    </div>
                    <strong>{notice.likeCount}</strong>
                  </div>
                  <p className="noticeBody">{notice.body}</p>
                  <div className="noticeReaderRows">
                    {notice.readers.map((reader) => (
                      <div className="noticeReaderRow" key={`${notice.id}-${reader.memberId}`}>
                        <span>{reader.memberName}</span>
                        <strong className={reader.read ? "readState read" : "readState unread"}>
                          {reader.read ? "확인" : "미확인"}
                        </strong>
                        <form action={markNoticeReadAction.bind(null, notice.id)}>
                          <input name="memberId" type="hidden" value={reader.memberId} />
                          <button className="secondary compact" type="submit">
                            확인 처리
                          </button>
                        </form>
                        <form action={toggleNoticeReactionAction.bind(null, notice.id)}>
                          <input name="memberId" type="hidden" value={reader.memberId} />
                          <button className="secondary compact" type="submit">
                            좋아요
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                  <div className="noticeComments">
                    {notice.comments.map((comment) => (
                      <div className="noticeComment" key={comment.id}>
                        <strong>{comment.memberName}</strong>
                        <span>{comment.body}</span>
                      </div>
                    ))}
                  </div>
                  <form action={createNoticeCommentAction.bind(null, notice.id)} className="noticeCommentForm">
                    <select name="memberId" defaultValue={overview.members[0]?.id}>
                      {overview.members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    <input name="body" placeholder="댓글 입력" required />
                    <button className="secondary compact" type="submit">
                      댓글
                    </button>
                  </form>
                </div>
              ))}
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}

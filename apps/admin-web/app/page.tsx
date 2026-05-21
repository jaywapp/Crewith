import { AdminShell, PageTitle, UnauthorizedPanel, formatDate, getOverview } from "./admin";

export default async function DashboardPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  const metrics = [
    ["전체 회원", `${overview.dashboard.totalMemberCount}명`],
    ["활성 회원", `${overview.dashboard.activeMemberCount}명`],
    ["회비 미납", `${overview.dashboard.overdueMemberCount}명`],
    ["공지 확인률", `${overview.dashboard.noticeReadRate}%`],
    ["실제 출석률", `${overview.dashboard.attendanceRate}%`],
    ["월 회비 수납률", `${overview.dashboard.monthlyFeeCollectionRate}%`],
  ];

  return (
    <AdminShell active="/" overview={overview}>
      <PageTitle title="대시보드" description="모임 운영 상태와 오늘 처리해야 할 일을 한눈에 확인합니다." />

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
          <p>체험 종료일은 {overview.club.trialEndsAt}입니다. 결제 연동 전까지 구독 상태만 표시합니다.</p>
        </article>
      </section>

      <section className="pageGrid">
        <article className="panel">
          <div className="panelHeader">
            <h2>다가오는 일정</h2>
          </div>
          <div className="stack">
            {overview.events.slice(0, 3).map((event) => (
              <div className="summaryLine" key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <span>
                    {formatDate(event.startsAt)} · {event.locationName}
                  </span>
                </div>
                <strong>{event.attendingCount}명</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>최근 공지</h2>
          </div>
          <div className="stack">
            {overview.notices.slice(0, 3).map((notice) => (
              <div className="summaryLine" key={notice.id}>
                <div>
                  <strong>{notice.title}</strong>
                  <span>
                    확인 {notice.readCount}명 · 미확인 {notice.unreadCount}명
                  </span>
                </div>
                <strong>{notice.visibility === "operators_only" ? "운영진" : "전체"}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}

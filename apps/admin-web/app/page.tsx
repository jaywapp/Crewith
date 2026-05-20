const metrics = [
  ["전체 회원", "28"],
  ["활성 회원", "25"],
  ["미납자", "3"],
  ["공지 확인률", "82%"],
  ["실제 출석률", "74%"],
  ["회비 수납률", "88%"],
];

const navItems = [
  "대시보드",
  "구성원",
  "회비",
  "일정",
  "공지",
  "가입/초대",
  "통계",
  "설정",
];

export default function AdminHome() {
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
            <p className="eyebrow">토요 풋살 · 운영진</p>
            <h1>모임 운영 대시보드</h1>
          </div>
          <div className="actions">
            <button className="secondary">일정 생성</button>
            <button className="primary">공지 작성</button>
          </div>
        </header>

        <section className="metrics">
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
              <h2>작업 큐</h2>
              <a href="#">전체 보기</a>
            </div>
            <ul className="taskList">
              <li>
                <span>가입 신청 대기</span>
                <strong>2건</strong>
              </li>
              <li>
                <span>회비 미납자</span>
                <strong>3명</strong>
              </li>
              <li>
                <span>다가오는 일정</span>
                <strong>토요일 10:00</strong>
              </li>
            </ul>
          </article>

          <article className="panel dark">
            <p className="eyebrow">무료 체험</p>
            <h2>30일 체험이 진행 중입니다.</h2>
            <p>요금제는 30명 이하 구간으로 표시됩니다. 실제 결제는 MVP 이후 연동합니다.</p>
          </article>
        </section>
      </section>
    </main>
  );
}

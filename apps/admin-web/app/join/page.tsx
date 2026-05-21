import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  createInviteLinkAction,
  getOverview,
  reviewJoinRequestAction,
} from "../admin";

export default async function JoinPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  const pendingCount = overview.joinRequests.filter((request) => request.status === "pending").length;

  return (
    <AdminShell active="/join" overview={overview}>
      <PageTitle title="가입/초대" description="공개 모임 가입 신청과 비공개 모임 초대 링크를 관리합니다." />

      <section className="pageGrid">
        <article className="panel">
          <div className="panelHeader">
            <h2>초대 링크</h2>
            <span className="muted">{overview.inviteLinks.length}개</span>
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
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>가입 신청</h2>
            <span className="muted">대기 {pendingCount}건</span>
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
        </article>
      </section>
    </AdminShell>
  );
}

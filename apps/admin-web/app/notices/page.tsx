import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  createNoticeAction,
  createNoticeCommentAction,
  deleteNoticeAction,
  getOverview,
  markNoticeReadAction,
  toggleNoticeReactionAction,
  updateNoticeAction,
} from "../admin";

export default async function NoticesPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  return (
    <AdminShell active="/notices" overview={overview}>
      <PageTitle title="공지 관리" description="공지 작성, 공개 범위, 회원별 확인 여부, 댓글과 좋아요를 관리합니다." />

      <article className="panel">
        <div className="panelHeader">
          <h2>공지 작성</h2>
          <span className="muted">확인율 {overview.dashboard.noticeReadRate}%</span>
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
      </article>

      <section className="stack">
        {overview.notices.map((notice) => (
          <article className="panel" key={notice.id}>
            <div className="summaryLine">
              <div>
                <strong>{notice.title}</strong>
                <span>
                  {notice.visibility === "operators_only" ? "운영진만" : "전체 회원"} · 확인 {notice.readCount}명 · 미확인{" "}
                  {notice.unreadCount}명
                </span>
              </div>
              <strong>좋아요 {notice.likeCount}</strong>
            </div>

            <form action={updateNoticeAction.bind(null, notice.id)} className="noticeEditForm">
              <label>
                제목
                <input name="title" defaultValue={notice.title} required />
              </label>
              <label>
                권한
                <select name="visibility" defaultValue={notice.visibility}>
                  <option value="all_members">전체 회원</option>
                  <option value="operators_only">운영진만</option>
                </select>
              </label>
              <label className="wideField">
                내용
                <textarea name="body" defaultValue={notice.body} required />
              </label>
              <button className="secondary compact" type="submit">
                수정
              </button>
            </form>

            <form action={deleteNoticeAction.bind(null, notice.id)} className="deleteRow">
              <button className="danger compact" type="submit">
                공지 삭제
              </button>
            </form>

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
          </article>
        ))}
      </section>
    </AdminShell>
  );
}

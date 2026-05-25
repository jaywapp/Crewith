import { AdminShell, PageTitle, UnauthorizedPanel, getOverview, sendFeedbackAction } from "../admin";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { overview, authorized } = await getOverview();
  const { sent } = await searchParams;

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  return (
    <AdminShell active="/feedback" overview={overview}>
      <PageTitle title="의견 보내기" description="버그 신고, 기능 개선 요청 등 개발팀에 자유롭게 의견을 보내주세요." />

      <section className="pageGrid">
        <article className="panel">
          {sent === "1" ? (
            <div className="feedbackSuccess">
              <p>✓ 의견이 접수되었습니다. 소중한 의견 감사합니다!</p>
              <a href="/feedback">다시 보내기</a>
            </div>
          ) : (
            <form action={sendFeedbackAction} className="feedbackForm">
              <label>
                분류
                <select name="category">
                  <option value="bug">버그 신고</option>
                  <option value="improvement">기능 개선 요청</option>
                  <option value="other">기타</option>
                </select>
              </label>
              <label>
                제목
                <input name="title" type="text" placeholder="한 줄로 요약해주세요" required />
              </label>
              <label>
                내용
                <textarea name="body" placeholder="자세히 설명해주세요" required />
              </label>
              <button className="primary compact" type="submit">
                보내기
              </button>
            </form>
          )}
        </article>
      </section>
    </AdminShell>
  );
}

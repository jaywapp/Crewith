import { AdminShell, PageTitle, UnauthorizedPanel, getOverview, sendFeedbackAction } from "../admin";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { overview, authorized } = await getOverview();
  const { sent, error } = await searchParams;

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  return (
    <AdminShell active="/feedback" overview={overview}>
      <PageTitle title="제보" description="버그나 개선 제안을 Crewith 저장소에 제보합니다." />

      <section className="pageGrid">
        <article className="panel">
          {sent === "1" ? (
            <div className="feedbackSuccess">
              <p>✓ 제보 #{sent}이(가) 접수되었습니다.</p>
              <a href="/feedback">새 제보 작성</a>
            </div>
          ) : (
            <form action={sendFeedbackAction} className="feedbackForm">
              {error ? (
                <p role="alert">
                  {error === "invalid"
                    ? "제목과 내용을 확인해 주세요."
                    : "제보 전송에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요."}
                </p>
              ) : null}
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
                <input name="title" type="text" maxLength={120} placeholder="한 줄로 요약해주세요" required />
              </label>
              <label>
                내용
                <textarea name="body" maxLength={5000} placeholder="자세히 설명해주세요" required />
              </label>
              <label>
                회신 연락처 (선택)
                <input name="contact" type="text" maxLength={200} autoComplete="email" />
              </label>
              <p>앱 버전과 플랫폼 정보가 함께 전송됩니다. 로그·기기 식별자는 전송하지 않습니다.</p>
              <button className="primary compact" type="submit" aria-label="제보 전송">
                제보하기
              </button>
            </form>
          )}
        </article>
      </section>
    </AdminShell>
  );
}

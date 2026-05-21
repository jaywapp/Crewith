import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  createFeeAction,
  feeStatusLabels,
  formatCurrency,
  getOverview,
  updateFeePaymentAction,
} from "../admin";

export default async function FeesPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  return (
    <AdminShell active="/fees" overview={overview}>
      <PageTitle title="회비 관리" description="월회비와 일회성 비용을 만들고 회원별 납부 상태를 조정합니다." />

      <article className="panel">
        <div className="panelHeader">
          <h2>회비 항목 생성</h2>
          <span className="muted">수납률 {overview.dashboard.monthlyFeeCollectionRate}%</span>
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
      </article>

      <section className="stack">
        {overview.fees.map((fee) => (
          <article className="panel" key={fee.id}>
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
                <form action={updateFeePaymentAction.bind(null, fee.id)} className="feePaymentRow" key={`${fee.id}-${payment.memberId}`}>
                  <input name="memberId" type="hidden" value={payment.memberId} />
                  <span>{payment.memberName}</span>
                  <select name="status" defaultValue={payment.status}>
                    {Object.entries(feeStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button className="secondary compact" type="submit">
                    저장
                  </button>
                </form>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}

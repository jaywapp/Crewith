import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  createFeeAction,
  feeStatusLabels,
  formatCurrency,
  getOverview,
  updateFeePaymentAction,
  updateFeeSettingsAction,
} from "../admin";

const intervalLabels = {
  weekly: "주간",
  biweekly: "격주",
  monthly: "월간",
  quarterly: "분기",
  yearly: "연간",
  custom: "사용자 지정",
};

export default async function FeesPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  const settings = overview.feeSettings;

  return (
    <AdminShell active="/fees" overview={overview}>
      <PageTitle title="회비 관리" description="월회비 규칙과 일회성 비용을 만들고 회원별 납부 상태를 조정합니다." />

      <section className="pageGrid">
        <article className="panel">
          <div className="panelHeader">
            <h2>월회비 설정</h2>
            <span className="muted">
              {intervalLabels[settings.intervalType]} · 매월 {settings.dueDay}일
            </span>
          </div>
          <form action={updateFeeSettingsAction} className="feeCreateForm">
            <label>
              기본 금액
              <input name="amount" defaultValue={settings.amount} min="0" required type="number" />
            </label>
            <label>
              납부일
              <input name="dueDay" defaultValue={settings.dueDay} max="31" min="1" required type="number" />
            </label>
            <label>
              납부 간격
              <select name="intervalType" defaultValue={settings.intervalType}>
                {Object.entries(intervalLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              사용자 지정 간격(일)
              <input name="customIntervalDays" defaultValue={settings.customIntervalDays ?? ""} min="1" type="number" />
            </label>
            <label>
              유예기간
              <input name="gracePeriodDays" defaultValue={settings.gracePeriodDays} min="0" required type="number" />
            </label>
            <label>
              리마인더 발송일
              <input name="reminderDaysAfterDue" defaultValue={settings.reminderDaysAfterDue.join(", ")} placeholder="1, 3, 7" />
            </label>
            <label className="checkboxField">
              <input name="autoReminderEnabled" defaultChecked={settings.autoReminderEnabled} type="checkbox" />
              미납 알림 자동 발송
            </label>
            <button className="primary compact" type="submit">
              설정 저장
            </button>
          </form>
        </article>

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
      </section>

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

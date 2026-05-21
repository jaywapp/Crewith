import { AdminShell, PageTitle, UnauthorizedPanel, formatDate, getOverview, sendReminderAction } from "../admin";

export default async function RemindersPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  return (
    <AdminShell active="/reminders" overview={overview}>
      <PageTitle title="알림" description="회비 미납, 일정 미응답, 공지 미확인 대상자를 확인하고 발송 로그를 남깁니다." />

      <section className="reminderGrid">
        {overview.reminderTargets.map((reminder) => (
          <article className="panel reminderCard" key={reminder.id}>
            <div className="summaryLine">
              <div>
                <strong>{reminder.title}</strong>
                <span>{reminder.description}</span>
              </div>
              <strong>{reminder.targetCount}명</strong>
            </div>
            <div className="reminderTargets">
              {reminder.targets.length === 0 ? (
                <span className="emptyState">발송 대상 없음</span>
              ) : (
                reminder.targets.map((target) => (
                  <div className="reminderTarget" key={`${reminder.id}-${target.memberId}`}>
                    <strong>{target.memberName}</strong>
                    <span>
                      {target.phoneNumber} · {target.reason}
                    </span>
                  </div>
                ))
              )}
            </div>
            <form action={sendReminderAction} className="reminderAction">
              <input name="reminderId" type="hidden" value={reminder.id} />
              <button className="primary compact" disabled={reminder.targetCount === 0} type="submit">
                발송 기록
              </button>
            </form>
          </article>
        ))}
      </section>

      <article className="panel notificationPanel">
        <div className="panelHeader">
          <h2>발송 로그</h2>
          <span className="muted">{overview.notificationLogs.length}건</span>
        </div>
        <div className="notificationLogs">
          {overview.notificationLogs.length === 0 ? <span className="emptyState">아직 발송 기록이 없습니다.</span> : null}
          {overview.notificationLogs.map((log) => (
            <div className="notificationLog" key={log.id}>
              <strong>{log.title}</strong>
              <span>
                {formatDate(log.sentAt)} · {log.targetCount}명 · {log.channel === "app_push" ? "앱 푸시" : log.channel}
              </span>
            </div>
          ))}
        </div>
      </article>
    </AdminShell>
  );
}

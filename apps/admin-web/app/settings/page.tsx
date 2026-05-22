import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  getOverview,
  updateNotificationSettingsAction,
  updatePrivacySettingsAction,
} from "../admin";

export default async function SettingsPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  const privacySettings = overview.privacySettings;
  const notificationSettings = overview.notificationSettings;

  return (
    <AdminShell active="/settings" overview={overview}>
      <PageTitle title="설정" description="모임 운영 정책, 회원 개인정보 공개 범위, 알림 발송 기준을 관리합니다." />

      <section className="pageGrid">
        <article className="panel">
          <div className="panelHeader">
            <h2>개인정보 공개 설정</h2>
            <span className="muted">일반 회원에게 보이는 정보</span>
          </div>
          <form action={updatePrivacySettingsAction} className="settingsForm">
            <label className="checkboxField">
              <input name="showPhoneNumberToMembers" defaultChecked={privacySettings.showPhoneNumberToMembers} type="checkbox" />
              휴대폰 번호 공개
            </label>
            <label className="checkboxField">
              <input name="showBirthDateToMembers" defaultChecked={privacySettings.showBirthDateToMembers} type="checkbox" />
              생년월일 공개
            </label>
            <label className="checkboxField">
              <input name="showGenderToMembers" defaultChecked={privacySettings.showGenderToMembers} type="checkbox" />
              성별 공개
            </label>
            <button className="primary compact" type="submit">
              공개 설정 저장
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>알림 설정</h2>
            <span className="muted">리마인더 대상 산정 기준</span>
          </div>
          <form action={updateNotificationSettingsAction} className="settingsForm">
            <label className="checkboxField">
              <input name="feeReminderEnabled" defaultChecked={notificationSettings.feeReminderEnabled} type="checkbox" />
              회비 미납 리마인더 사용
            </label>
            <label>
              회비 미납 발송 기준
              <input
                name="feeReminderDaysAfterDue"
                defaultValue={notificationSettings.feeReminderDaysAfterDue.join(", ")}
                placeholder="1, 3, 7"
              />
            </label>
            <label className="checkboxField">
              <input name="eventReminderEnabled" defaultChecked={notificationSettings.eventReminderEnabled} type="checkbox" />
              일정 참석 확인 리마인더 사용
            </label>
            <label>
              일정 시작 전 발송 기준
              <input
                name="eventReminderHoursBefore"
                defaultValue={notificationSettings.eventReminderHoursBefore.join(", ")}
                placeholder="24, 3"
              />
            </label>
            <label className="checkboxField">
              <input
                name="noticeUnreadReminderEnabled"
                defaultChecked={notificationSettings.noticeUnreadReminderEnabled}
                type="checkbox"
              />
              공지 미확인 리마인더 사용
            </label>
            <label>
              공지 게시 후 발송 기준
              <input
                name="noticeUnreadReminderHoursAfter"
                defaultValue={notificationSettings.noticeUnreadReminderHoursAfter.join(", ")}
                placeholder="24, 48"
              />
            </label>
            <button className="primary compact" type="submit">
              알림 설정 저장
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>데이터 보존 정책</h2>
            <span className="muted">MVP 정책</span>
          </div>
          <div className="settingsSummary">
            <strong>탈퇴, 강퇴, 휴면 회원</strong>
            <p>회원 상태가 휴면, 탈퇴, 삭제로 변경되면 개인정보 삭제 예정일이 30일 후로 자동 기록됩니다.</p>
            <strong>운영 이력</strong>
            <p>회비 납부 기록과 출석 기록은 운영 통계 유지를 위해 보존합니다.</p>
          </div>
        </article>
      </section>
    </AdminShell>
  );
}

import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  getOverview,
  updatePrivacySettingsAction,
} from "../admin";

export default async function SettingsPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  const settings = overview.privacySettings;

  return (
    <AdminShell active="/settings" overview={overview}>
      <PageTitle title="설정" description="모임 운영 정책과 회원 개인정보 공개 범위를 관리합니다." />

      <section className="pageGrid">
        <article className="panel">
          <div className="panelHeader">
            <h2>개인정보 공개 설정</h2>
            <span className="muted">일반 회원에게 보이는 정보</span>
          </div>
          <form action={updatePrivacySettingsAction} className="settingsForm">
            <label className="checkboxField">
              <input name="showPhoneNumberToMembers" defaultChecked={settings.showPhoneNumberToMembers} type="checkbox" />
              휴대폰 번호 공개
            </label>
            <label className="checkboxField">
              <input name="showBirthDateToMembers" defaultChecked={settings.showBirthDateToMembers} type="checkbox" />
              생년월일 공개
            </label>
            <label className="checkboxField">
              <input name="showGenderToMembers" defaultChecked={settings.showGenderToMembers} type="checkbox" />
              성별 공개
            </label>
            <button className="primary compact" type="submit">
              설정 저장
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

import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  createMemberAction,
  feeStatusLabels,
  getOverview,
  importMembersAction,
  memberStatusLabels,
  removeMemberAction,
  roleLabels,
  updateMemberAction,
} from "../admin";

export default async function MembersPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  return (
    <AdminShell active="/members" overview={overview}>
      <PageTitle title="회원 관리" description="회원 추가, 일괄 등록, 역할 변경, 상태 변경, 삭제 처리를 관리합니다." />

      <article className="panel">
        <div className="panelHeader">
          <h2>회원 추가</h2>
          <span className="muted">현재 {overview.members.length}명</span>
        </div>
        <form action={createMemberAction} className="memberCreateForm">
          <label>
            이름
            <input name="name" placeholder="홍길동" required />
          </label>
          <label>
            휴대폰 번호
            <input name="phoneNumber" placeholder="010-0000-0000" required />
          </label>
          <label>
            역할
            <select name="role" defaultValue="member">
              <option value="member">일반회원</option>
              <option value="operator">운영진</option>
              <option value="owner">모임장</option>
            </select>
          </label>
          <button className="primary" type="submit">
            회원 추가
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panelHeader">
          <h2>명부 일괄 등록</h2>
          <span className="muted">엑셀에서 이름, 휴대폰, 역할 열을 복사해 붙여넣기</span>
        </div>
        <form action={importMembersAction} className="memberImportForm">
          <label>
            명부 데이터
            <textarea
              name="rows"
              placeholder={"김민수,010-1111-1111,member\n이서연\t010-2222-2222\toperator"}
              required
              rows={5}
            />
          </label>
          <button className="secondary" type="submit">
            일괄 등록
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panelHeader">
          <h2>회원 목록</h2>
          <span className="muted">{overview.members.length}명</span>
        </div>
        <div className="memberRows">
          {overview.members.map((member) => (
            <form action={updateMemberAction.bind(null, member.id)} className="memberRow" key={member.id}>
              <div className="memberIdentity">
                <strong>{member.name}</strong>
                <span>
                  {member.phoneNumber} · 가입 {member.joinedAt}
                </span>
              </div>
              <label>
                역할
                <select name="role" defaultValue={member.role}>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                상태
                <select name="memberStatus" defaultValue={member.memberStatus}>
                  {Object.entries(memberStatusLabels)
                    .filter(([value]) => value !== "removed")
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                회비
                <select name="lastFeeStatus" defaultValue={member.lastFeeStatus}>
                  {Object.entries(feeStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <span className={`status ${member.lastFeeStatus}`}>{feeStatusLabels[member.lastFeeStatus]}</span>
              <button className="secondary compact" type="submit">
                저장
              </button>
              <button className="danger compact" formAction={removeMemberAction.bind(null, member.id)}>
                삭제
              </button>
            </form>
          ))}
        </div>
      </article>
    </AdminShell>
  );
}

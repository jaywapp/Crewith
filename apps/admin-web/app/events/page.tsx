import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  createEventAction,
  deleteEventAction,
  formatDate,
  getOverview,
  updateAttendanceAction,
  updateEventAction,
  updateEventResponseAction,
} from "../admin";

function toDateTimeLocal(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

export default async function EventsPage() {
  const { overview, authorized } = await getOverview();

  if (!authorized) {
    return <UnauthorizedPanel />;
  }

  return (
    <AdminShell active="/events" overview={overview}>
      <PageTitle title="일정/출석" description="일정을 만들고 참석 의사와 실제 출석부를 함께 관리합니다." />

      <article className="panel">
        <div className="panelHeader">
          <h2>일정 생성</h2>
          <span className="muted">참석 대비 출석률 {overview.dashboard.attendanceConversionRate}%</span>
        </div>
        <form action={createEventAction} className="eventCreateForm">
          <label>
            일정명
            <input name="title" placeholder="주말 정기 모임" required />
          </label>
          <label>
            일시
            <input name="startsAt" required type="datetime-local" />
          </label>
          <label>
            장소
            <input name="locationName" placeholder="서울숲" required />
          </label>
          <label>
            주소
            <input name="locationAddress" placeholder="지도 연동 전까지 주소 입력" />
          </label>
          <label>
            응답 마감
            <input name="responseDeadline" type="datetime-local" />
          </label>
          <label>
            공개 범위
            <select name="visibility" defaultValue="all_members">
              <option value="all_members">전체 회원</option>
              <option value="operators_only">운영진만</option>
            </select>
          </label>
          <button className="primary compact" type="submit">
            추가
          </button>
        </form>
      </article>

      <section className="stack">
        {overview.events.map((event) => (
          <article className="panel" key={event.id}>
            <div className="summaryLine">
              <div>
                <strong>{event.title}</strong>
                <span>
                  {formatDate(event.startsAt)} · {event.locationName} ·{" "}
                  {event.visibility === "operators_only" ? "운영진만" : "전체 회원"}
                </span>
              </div>
              <strong>{event.presentCount + event.lateCount}명</strong>
            </div>

            <form action={updateEventAction.bind(null, event.id)} className="eventEditForm">
              <label>
                일정명
                <input name="title" defaultValue={event.title} required />
              </label>
              <label>
                일시
                <input name="startsAt" type="datetime-local" defaultValue={toDateTimeLocal(event.startsAt)} required />
              </label>
              <label>
                장소
                <input name="locationName" defaultValue={event.locationName} required />
              </label>
              <label>
                주소
                <input name="locationAddress" defaultValue={event.locationAddress ?? ""} />
              </label>
              <label>
                응답 마감
                <input
                  name="responseDeadline"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(event.responseDeadline)}
                />
              </label>
              <label>
                공개 범위
                <select name="visibility" defaultValue={event.visibility}>
                  <option value="all_members">전체 회원</option>
                  <option value="operators_only">운영진만</option>
                </select>
              </label>
              <button className="secondary compact" type="submit">
                수정
              </button>
            </form>

            <form action={deleteEventAction.bind(null, event.id)} className="deleteRow">
              <button className="danger compact" type="submit">
                일정 삭제
              </button>
            </form>

            <div className="feeMeta">
              <span>참석 예정 {event.attendingCount}명</span>
              <span>불참 예정 {event.notAttendingCount}명</span>
              <span>출석 {event.presentCount}명</span>
              <span>지각 {event.lateCount}명</span>
              <span>결석 {event.absentCount}명</span>
            </div>
            <div className="eventParticipantRows">
              {event.participants.map((participant) => (
                <div className="eventParticipantRow" key={`${event.id}-${participant.memberId}`}>
                  <strong>{participant.memberName}</strong>
                  <form action={updateEventResponseAction.bind(null, event.id)}>
                    <input name="memberId" type="hidden" value={participant.memberId} />
                    <select name="response" defaultValue={participant.response}>
                      <option value="attending">참석 예정</option>
                      <option value="not_attending">불참 예정</option>
                    </select>
                    <button className="secondary compact" type="submit">
                      저장
                    </button>
                  </form>
                  <form action={updateAttendanceAction.bind(null, event.id)}>
                    <input name="memberId" type="hidden" value={participant.memberId} />
                    <select name="status" defaultValue={participant.attendanceStatus}>
                      <option value="present">출석</option>
                      <option value="late">지각</option>
                      <option value="absent">결석</option>
                    </select>
                    <input min="0" name="companionCount" type="number" defaultValue={participant.companionCount} />
                    <button className="secondary compact" type="submit">
                      저장
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}

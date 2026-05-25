import { createClubAction } from "../../admin";

export default function NewClubPage() {
  return (
    <main className="loginPage">
      <div className="loginCard">
        <p className="brand">Crewith</p>
        <h1>모임 만들기</h1>
        <p className="muted">새 모임을 만들면 모임장으로 자동 등록됩니다.</p>
        <form action={createClubAction} className="loginForm">
          <label>
            모임 이름
            <input name="name" type="text" placeholder="서울 러너스" required />
          </label>
          <label>
            종목
            <input name="sportType" type="text" placeholder="러닝" required />
          </label>
          <button className="primary" type="submit">
            모임 만들기
          </button>
        </form>
      </div>
    </main>
  );
}

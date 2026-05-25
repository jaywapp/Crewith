import { createClubAction } from "../../admin";

const sportCategories = [
  "🏃 러닝",
  "⚽ 축구",
  "🏀 농구",
  "🎾 테니스",
  "🏊 수영",
  "🚴 자전거",
  "🥊 복싱",
  "⛳ 골프",
  "🏐 배구",
  "🏋️ 헬스",
  "🧘 요가",
  "🎿 스키",
];

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
            <input
              name="sportType"
              list="sportTypeOptions"
              type="text"
              placeholder="러닝 또는 직접 입력"
              required
            />
          </label>
          <datalist id="sportTypeOptions">
            {sportCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <button className="primary" type="submit">
            모임 만들기
          </button>
        </form>
      </div>
    </main>
  );
}

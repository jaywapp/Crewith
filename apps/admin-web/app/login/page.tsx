import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";
const adminSessionCookieName = "crewith-admin-session";

async function loginAction(formData: FormData) {
  "use server";

  let result: { ok: boolean; data?: Record<string, unknown>; error?: string };

  try {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: formData.get("phoneNumber"),
        password: formData.get("password"),
      }),
    });

    if (!response.ok) {
      result = { ok: false, error: "전화번호 또는 비밀번호를 확인하세요." };
    } else {
      const envelope = (await response.json()) as { data: Record<string, unknown> };
      result = { ok: true, data: envelope.data };
    }
  } catch {
    result = { ok: false, error: "서버에 연결할 수 없습니다." };
  }

  if (!result.ok) {
    redirect("/login?error=" + encodeURIComponent(result.error!));
  }

  const clubs = result.data!.clubs as Array<{
    clubId: string;
    name: string;
    sportType: string;
    role: string;
  }>;

  const adminClubs = clubs.filter((c) => c.role === "owner" || c.role === "operator");

  const session = {
    memberId: result.data!.memberId as string,
    clubs: adminClubs,
    activeClubId: adminClubs[0]?.clubId ?? "",
  };

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  if (!adminClubs.length) {
    redirect("/clubs/new");
  }

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="loginPage">
      <div className="loginCard">
        <p className="brand">Crewith</p>
        <h1>관리자 로그인</h1>
        <p className="muted">모임장 또는 운영진 계정으로 로그인하세요.</p>
        {error && <p className="loginError">{decodeURIComponent(error)}</p>}
        <form action={loginAction} className="loginForm">
          <label>
            전화번호
            <input name="phoneNumber" type="tel" placeholder="01012345678" required autoComplete="username" />
          </label>
          <label>
            비밀번호
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="primary" type="submit">
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}

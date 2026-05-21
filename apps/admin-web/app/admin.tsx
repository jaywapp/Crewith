import type {
  AdminClubOverview,
  ApiEnvelope,
  ClubRole,
  FeeStatus,
  MemberStatus,
} from "@crewith/shared-types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";
const defaultClubId = "club-seoul-runners";
const activeClubCookieName = "crewith-admin-club-id";
const adminRoleHeaders = { "x-crewith-role": "owner" };
const adminJsonHeaders = { "Content-Type": "application/json", ...adminRoleHeaders };
const adminPaths = ["/", "/members", "/fees", "/events", "/notices", "/join", "/reminders"];

const adminClubs = [
  { id: "club-seoul-runners", name: "서울 러너스", sportType: "러닝" },
  { id: "club-seoul-riders", name: "Seoul Riders", sportType: "cycling" },
];

export const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/members", label: "회원 관리" },
  { href: "/fees", label: "회비 관리" },
  { href: "/events", label: "일정/출석" },
  { href: "/notices", label: "공지 관리" },
  { href: "/join", label: "가입/초대" },
  { href: "/reminders", label: "알림" },
];

export const roleLabels: Record<ClubRole, string> = {
  owner: "모임장",
  operator: "운영진",
  member: "일반회원",
};

export const memberStatusLabels: Record<MemberStatus, string> = {
  active: "활성",
  dormant: "휴면",
  left: "탈퇴",
  removed: "삭제",
};

export const feeStatusLabels: Record<FeeStatus, string> = {
  paid: "납부",
  unpaid: "미납",
  exempt: "면제",
};

const fallbackOverview: AdminClubOverview = {
  club: {
    id: defaultClubId,
    name: "서울 러너스",
    sportType: "러닝",
    visibility: "private",
    subscriptionStatus: "trial",
    trialEndsAt: "2026-06-20",
  },
  dashboard: {
    totalMemberCount: 0,
    activeMemberCount: 0,
    overdueMemberCount: 0,
    noticeReadRate: 0,
    attendanceRate: 0,
    attendanceConversionRate: 0,
    monthlyFeeCollectionRate: 0,
  },
  feeSettings: {
    clubId: defaultClubId,
    amount: 30000,
    dueDay: 25,
    intervalType: "monthly",
    gracePeriodDays: 3,
    autoReminderEnabled: true,
    reminderDaysAfterDue: [1, 3, 7],
  },
  members: [],
  fees: [],
  events: [],
  notices: [],
  joinRequests: [],
  inviteLinks: [],
  reminderTargets: [],
  notificationLogs: [],
  tasks: [],
};

function safeClubId(value: FormDataEntryValue | string | undefined | null) {
  const nextValue = typeof value === "string" ? value : "";
  return adminClubs.some((club) => club.id === nextValue) ? nextValue : defaultClubId;
}

async function getActiveClubId() {
  const cookieStore = await cookies();
  return safeClubId(cookieStore.get(activeClubCookieName)?.value);
}

export async function getOverview() {
  const clubId = await getActiveClubId();

  try {
    const response = await fetch(`${apiBaseUrl}/clubs/${clubId}/admin/overview`, {
      cache: "no-store",
      headers: adminRoleHeaders,
    });

    if (!response.ok) {
      return { overview: fallbackOverview, authorized: false };
    }

    const envelope = (await response.json()) as ApiEnvelope<AdminClubOverview>;
    return { overview: envelope.data, authorized: true };
  } catch {
    return { overview: fallbackOverview, authorized: true };
  }
}

function revalidateAdmin() {
  for (const path of adminPaths) {
    revalidatePath(path);
  }
}

export async function switchClubAction(formData: FormData) {
  "use server";

  const nextClubId = safeClubId(formData.get("clubId"));
  const cookieStore = await cookies();
  cookieStore.set(activeClubCookieName, nextClubId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidateAdmin();
}

export async function createMemberAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/members`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      role: formData.get("role"),
    }),
  });

  revalidateAdmin();
}

export async function importMembersAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/members/imports`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      rows: formData.get("rows"),
    }),
  });

  revalidateAdmin();
}

export async function updateMemberAction(memberId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/members/${memberId}`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      role: formData.get("role"),
      memberStatus: formData.get("memberStatus"),
      lastFeeStatus: formData.get("lastFeeStatus"),
    }),
  });

  revalidateAdmin();
}

export async function removeMemberAction(memberId: string) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/members/${memberId}`, {
    method: "DELETE",
    headers: adminRoleHeaders,
  });

  revalidateAdmin();
}

export async function createFeeAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/fees`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      title: formData.get("title"),
      feeType: formData.get("feeType"),
      amount: Number(formData.get("amount")),
      dueDate: formData.get("dueDate"),
    }),
  });

  revalidateAdmin();
}

export async function updateFeeSettingsAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  const reminderDaysAfterDue = `${formData.get("reminderDaysAfterDue") ?? ""}`
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0);

  await fetch(`${apiBaseUrl}/clubs/${clubId}/fee-settings`, {
    method: "PUT",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      amount: Number(formData.get("amount")),
      dueDay: Number(formData.get("dueDay")),
      intervalType: formData.get("intervalType"),
      customIntervalDays: Number(formData.get("customIntervalDays")),
      gracePeriodDays: Number(formData.get("gracePeriodDays")),
      autoReminderEnabled: formData.get("autoReminderEnabled") === "on",
      reminderDaysAfterDue,
    }),
  });

  revalidateAdmin();
}

export async function updateFeePaymentAction(feeId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/fees/${feeId}/payments`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      status: formData.get("status"),
    }),
  });

  revalidateAdmin();
}

export async function createEventAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/events`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      title: formData.get("title"),
      startsAt: formData.get("startsAt"),
      locationName: formData.get("locationName"),
      locationAddress: formData.get("locationAddress"),
      responseDeadline: formData.get("responseDeadline"),
      visibility: formData.get("visibility"),
    }),
  });

  revalidateAdmin();
}

export async function updateEventResponseAction(eventId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/events/${eventId}/responses`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      response: formData.get("response"),
    }),
  });

  revalidateAdmin();
}

export async function updateAttendanceAction(eventId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/events/${eventId}/attendance`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      status: formData.get("status"),
      companionCount: Number(formData.get("companionCount")),
    }),
  });

  revalidateAdmin();
}

export async function createNoticeAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      title: formData.get("title"),
      body: formData.get("body"),
      visibility: formData.get("visibility"),
    }),
  });

  revalidateAdmin();
}

export async function markNoticeReadAction(noticeId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices/${noticeId}/read`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({ memberId: formData.get("memberId") }),
  });

  revalidateAdmin();
}

export async function toggleNoticeReactionAction(noticeId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices/${noticeId}/reactions`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({ memberId: formData.get("memberId") }),
  });

  revalidateAdmin();
}

export async function createNoticeCommentAction(noticeId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/notices/${noticeId}/comments`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({
      memberId: formData.get("memberId"),
      body: formData.get("body"),
    }),
  });

  revalidateAdmin();
}

export async function reviewJoinRequestAction(requestId: string, status: "approved" | "rejected") {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/join-requests/${requestId}`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({ status }),
  });

  revalidateAdmin();
}

export async function createInviteLinkAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/invite-links`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({ expiresInDays: Number(formData.get("expiresInDays")) }),
  });

  revalidateAdmin();
}

export async function disableInviteLinkAction(inviteId: string) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/invite-links/${inviteId}/disable`, {
    method: "PATCH",
    headers: adminRoleHeaders,
  });

  revalidateAdmin();
}

export async function sendReminderAction(formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/reminders/send`, {
    method: "POST",
    headers: adminJsonHeaders,
    body: JSON.stringify({ reminderId: formData.get("reminderId") }),
  });

  revalidateAdmin();
}

export function AdminShell({
  active,
  overview,
  children,
}: {
  active: string;
  overview: AdminClubOverview;
  children: React.ReactNode;
}) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">Crewith</div>
        <nav>
          {navItems.map((item) => (
            <Link key={item.href} className={item.href === active ? "active" : ""} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {overview.club.sportType} 모임 · {overview.club.visibility === "private" ? "비공개" : "공개"}
            </p>
            <h1>{overview.club.name}</h1>
          </div>
          <div className="actions">
            <form className="clubSwitcher" action={switchClubAction}>
              <label htmlFor="admin-club-select">모임</label>
              <select id="admin-club-select" name="clubId" defaultValue={overview.club.id}>
                {adminClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
              <button className="secondary" type="submit">
                전환
              </button>
            </form>
            <Link className="secondary" href="/events">
              일정 생성
            </Link>
            <Link className="primary" href="/notices">
              공지 작성
            </Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function UnauthorizedPanel() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">Crewith</div>
      </aside>
      <section className="content">
        <article className="panel">
          <p className="eyebrow">권한 필요</p>
          <h1>관리자 권한이 필요합니다.</h1>
          <p className="muted">모임장 또는 운영진 계정으로 다시 접속해야 합니다.</p>
        </article>
      </section>
    </main>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="pageTitle">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

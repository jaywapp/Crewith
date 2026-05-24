# 인증 방식 변경: 휴대폰 OTP → 아이디/패스워드

## 개요

- **로그인 ID**: 전화번호 (기존과 동일, 멤버당 유니크)
- **패스워드**: 관리자가 멤버 추가 시 설정. 초기값은 전화번호 뒤 4자리
- **UX 변화**: 2단계(전화번호 입력 → 인증번호 입력) → 1단계(전화번호 + 패스워드 동시 입력)

---

## 1. API — `apps/api/`

### `src/mvp.store.ts`

**타입 변경**

```ts
// 제거
export interface AuthOtpRequestInput { ... }
export interface AuthOtpVerifyInput { ... }

// 추가
export interface AuthLoginInput {
  phoneNumber: string;
  password: string;
}

export interface ResetMemberPasswordInput {
  password: string;
}
```

**`AdminMemberListItem` 인터페이스에 필드 추가**

```ts
export interface AdminMemberListItem {
  // 기존 필드들...
  password: string;   // 추가 (평문 or 해시)
}
```

**`CreateAdminMemberInput`에 필드 추가**

```ts
export interface CreateAdminMemberInput {
  name: string;
  phoneNumber: string;
  role?: string;
  password: string;   // 추가
}
```

**`UpdateAdminMemberInput`에 필드 추가**

```ts
export interface UpdateAdminMemberInput {
  // 기존 필드들...
  password?: string;   // 추가 (비밀번호 재설정용)
}
```

**`MvpStore` 인터페이스 변경**

```ts
// 제거
export interface MvpStore {
  // otpCodes는 Map이라 JSON에 없었음 — 별도 처리 불필요
}
// 멤버 객체 안에 password가 포함되므로 members 배열로 자동 처리됨
```

**변수 변경**

```ts
// 제거
export const otpCodes = new Map<string, { code: string; expiresAt: string }>();

// 추가 없음 — 패스워드는 member 객체 안에 저장
```

**`createMemberFromProfile()` 함수 시그니처 변경**

```ts
// 변경 전
export function createMemberFromProfile(name: string, phoneNumber: string): AdminMemberListItem

// 변경 후 — 초기 패스워드 = 전화번호 뒤 4자리
export function createMemberFromProfile(name: string, phoneNumber: string): AdminMemberListItem {
  const digits = phoneNumber.replace(/\D/g, "");
  const password = digits.slice(-4);
  // ...
}
```

---

### `src/mvp.repository.ts`

**제거할 메서드**

```ts
requestOtp(input: AuthOtpRequestInput) { ... }   // 제거
verifyOtp(input: AuthOtpVerifyInput) { ... }       // 제거
```

**추가할 메서드**

```ts
login(input: AuthLoginInput) {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber ?? "");
  const password = `${input.password ?? ""}`.trim();

  const member = members.find(
    (m) => normalizePhoneNumber(m.phoneNumber) === phoneNumber && m.memberStatus !== "removed",
  );

  if (!member || member.password !== password) {
    throw new BadRequestException("전화번호 또는 비밀번호가 올바르지 않습니다.");
  }

  return {
    memberId: member.id,
    profile: buildProfile(member),
    clubs: clubMembershipSummaries(member.id),
  };
}

resetMemberPassword(memberId: string, input: ResetMemberPasswordInput) {
  const member = findMember(memberId);
  member.password = input.password.trim();
  persistStore();
  return { memberId: member.id };
}
```

**변경할 메서드**

```ts
// createMember — password 필드 처리 추가
createMember(clubId, input) {
  const nextMember = {
    // 기존 필드들...
    password: input.password?.trim() || phoneDigits.slice(-4),  // 미입력 시 전화번호 뒤 4자리
  };
}

// updateMember — password 필드 처리 추가
updateMember(clubId, memberId, input) {
  if (input.password?.trim()) {
    member.password = input.password.trim();
  }
  // 기존 로직...
}

// importMembers — password 컬럼 파싱 추가 (없으면 전화번호 뒤 4자리)
// reviewJoinRequest — 승인 시 초기 패스워드 = 전화번호 뒤 4자리 (createMemberFromProfile이 처리)
// acceptInvite — 초기 패스워드 = 전화번호 뒤 4자리 설정
```

**`MvpRepository` 추상 클래스 변경**

```ts
abstract requestOtp(...): ...    // 제거
abstract verifyOtp(...): ...      // 제거
abstract login(input: AuthLoginInput): unknown    // 추가
abstract resetMemberPassword(memberId: string, input: ResetMemberPasswordInput): unknown  // 추가
```

---

### `src/app.controller.ts`

**제거할 엔드포인트**

```ts
@Post("auth/otp/request")
requestOtp(@Body() input: AuthOtpRequestInput) { ... }   // 제거

@Post("auth/otp/verify")
verifyOtp(@Body() input: AuthOtpVerifyInput) { ... }       // 제거
```

**추가할 엔드포인트**

```ts
@Post("auth/login")
login(@Body() input: AuthLoginInput) {
  return { data: this.repository.login(input) };
}

@Patch("clubs/:clubId/members/:memberId/password")
resetMemberPassword(
  @Param("memberId") memberId: string,
  @Body() input: ResetMemberPasswordInput,
  @Headers("x-crewith-role") role: string | undefined,
) {
  assertOperatorRole(role);
  return { data: this.repository.resetMemberPassword(memberId, input) };
}
```

**import 변경**

```ts
// 제거
import { type AuthOtpRequestInput, type AuthOtpVerifyInput } from "./mvp.store";

// 추가
import { type AuthLoginInput, type ResetMemberPasswordInput } from "./mvp.store";
```

---

## 2. 모바일 앱 — `apps/mobile-app/`

### `lib/member_api_client.dart`

**제거할 메서드**

```dart
Future<bool> requestOtp(String phoneNumber) async { ... }         // 제거
Future<AuthSession?> verifyOtp(String phoneNumber, String code) async { ... }  // 제거
```

**추가할 메서드**

```dart
Future<AuthSession?> login(String phoneNumber, String password) async {
  final client = _client();
  try {
    final request = await client.postUrl(Uri.parse('$apiBaseUrl/auth/login'));
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode({'phoneNumber': phoneNumber, 'password': password}));
    final response = await request.close().timeout(const Duration(seconds: 15));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return AuthSession.fromJson(json['data'] as Map<String, dynamic>);
    }
  } catch (_) {
    return null;
  } finally {
    client.close(force: true);
  }
  return null;
}
```

---

### `lib/main.dart`

**변경할 콜백**

```dart
// 제거
Future<String?> _requestOtp(String phoneNumber) async { ... }
Future<bool> _verifyOtp(String phoneNumber, String code) async { ... }

// 추가
Future<bool> _login(String phoneNumber, String password) async {
  final session = await _api.login(phoneNumber, password);
  if (session == null || !mounted) return false;

  final nextClubs = session.clubs.isEmpty ? _defaultClubs : session.clubs;
  final nextClubId = nextClubs.any((c) => c.clubId == _activeClubId)
      ? _activeClubId
      : nextClubs.first.clubId;

  setState(() {
    _activeMemberId = session.memberId;
    _clubs = nextClubs;
    _activeClubId = nextClubId;
    _isAuthenticated = true;
    _overviewFuture = _fetchOverview(session.memberId);
    _memberDirectoryFuture = _fetchMemberDirectory(session.memberId);
    _notificationsFuture = _fetchNotifications(session.memberId);
  });

  await _api.registerDevice(
    memberId: session.memberId,
    fcmToken: 'dev-fcm-token-${session.memberId}',
  );

  return true;
}
```

**`AuthPage` 사용부 변경**

```dart
// 변경 전
return AuthPage(
  onOtpRequested: _requestOtp,
  onVerified: _verifyOtp,
);

// 변경 후
return AuthPage(onLogin: _login);
```

---

### `lib/screens/auth_page.dart`

**전체 재작성 수준의 변경**

```dart
// 변경 전: onOtpRequested, onVerified 두 콜백, 두 버튼
// 변경 후: onLogin 한 콜백, 로그인 버튼 하나

class AuthPage extends StatefulWidget {
  const AuthPage({super.key, required this.onLogin});
  final Future<bool> Function(String phoneNumber, String password) onLogin;
}

// UI:
// - 제목: '로그인'
// - 설명: '전화번호와 비밀번호를 입력하세요.'
// - 입력: 전화번호 필드, 비밀번호 필드 (obscureText: true)
// - 버튼: '로그인' (FilledButton 하나)
// - 오류: '전화번호 또는 비밀번호를 확인하세요.'
// - 초기값 하드코딩 제거 (빈 컨트롤러)
```

---

## 3. 관리자 웹 — `apps/admin-web/`

### `app/admin.tsx`

**`createMemberAction` 변경**

```ts
// password 필드 추가
export async function createMemberAction(formData: FormData) {
  await fetch(`${apiBaseUrl}/clubs/${clubId}/members`, {
    method: "POST",
    body: JSON.stringify({
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      role: formData.get("role"),
      password: formData.get("password"),  // 추가
    }),
  });
}
```

**`resetMemberPasswordAction` 추가**

```ts
export async function resetMemberPasswordAction(memberId: string, formData: FormData) {
  await fetch(`${apiBaseUrl}/clubs/${clubId}/members/${memberId}/password`, {
    method: "PATCH",
    headers: { "x-crewith-role": "owner" },
    body: JSON.stringify({ password: formData.get("password") }),
  });
  revalidatePath("/");
}
```

**멤버 추가 폼 UI 변경**

```tsx
// 기존 name, phoneNumber, role 필드에 추가
<input name="password" type="password" placeholder="초기 비밀번호" required />
// 미입력 시 서버에서 전화번호 뒤 4자리로 자동 설정
```

**멤버 목록 UI 변경**

```tsx
// 각 멤버 행에 "비밀번호 재설정" 버튼 추가
<form action={resetMemberPasswordAction.bind(null, member.id)}>
  <input name="password" type="text" placeholder="새 비밀번호" />
  <button type="submit">재설정</button>
</form>
```

---

## 변경 없는 파일

- `lib/member_models.dart` — `AuthSession` 구조 동일 (memberId, clubs)
- 나머지 API 엔드포인트 전부
- `member_ui.dart`, 각 화면 파일들 (auth_page 제외)

---

## 초기 패스워드 규칙 (요약)

| 생성 경로 | 초기 패스워드 |
|-----------|--------------|
| 관리자가 직접 추가 | 관리자가 설정 (필수 입력) |
| CSV 일괄 등록 | password 컬럼 있으면 사용, 없으면 전화번호 뒤 4자리 |
| 가입 신청 승인 | 전화번호 뒤 4자리 |
| 초대 링크 수락 | 전화번호 뒤 4자리 |

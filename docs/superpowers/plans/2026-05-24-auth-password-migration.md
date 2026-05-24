# Auth: OTP → Password 인증 방식 변경 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 휴대폰 OTP 인증을 전화번호+패스워드 방식으로 교체하고, 관리자가 멤버 추가 시 초기 패스워드를 설정할 수 있게 한다.

**Architecture:** API의 `POST /auth/otp/request` + `POST /auth/otp/verify` 두 엔드포인트를 `POST /auth/login` 단일 엔드포인트로 교체한다. `AdminMemberListItem`에 `password` 필드를 추가하고, 모바일 앱의 2단계 인증 UI를 1단계 로그인 폼으로 재작성한다. 관리자 웹에는 멤버 추가 시 비밀번호 입력과, 각 멤버 행에 비밀번호 재설정 폼을 추가한다.

**Tech Stack:** NestJS (TypeScript), Flutter (Dart), Next.js 14 (TypeScript, Server Actions)

---

## 파일 구조 요약

| 파일 | 변경 내용 |
|------|-----------|
| `apps/api/src/mvp.store.ts` | OTP 타입 제거, 로그인/패스워드 타입 추가, `AdminMemberListItem`에 `password` 추가 |
| `apps/api/src/mvp.repository.ts` | `requestOtp`/`verifyOtp` 제거, `login`/`resetMemberPassword` 추가, `createMember`/`updateMember`/`acceptInvite` 수정 |
| `apps/api/src/app.controller.ts` | OTP 엔드포인트 제거, `POST /auth/login` + `PATCH .../password` 추가 |
| `apps/mobile-app/lib/member_api_client.dart` | `requestOtp`/`verifyOtp` 제거, `login()` 추가 |
| `apps/mobile-app/lib/main.dart` | `_requestOtp`/`_verifyOtp` 제거, `_login()` 추가, `AuthPage` 사용부 변경 |
| `apps/mobile-app/lib/member_ui.dart` | `TextInput`에 `obscureText` 파라미터 추가 |
| `apps/mobile-app/lib/screens/auth_page.dart` | 전체 재작성 (2단계 → 1단계 로그인 폼) |
| `apps/admin-web/app/admin.tsx` | `createMemberAction`에 password 추가, `resetMemberPasswordAction` 추가 |
| `apps/admin-web/app/members/page.tsx` | 회원 추가 폼에 비밀번호 필드, 각 멤버 행에 비밀번호 재설정 폼 추가 |

---

### Task 1: API — 타입 변경 (`mvp.store.ts`)

**Files:**
- Modify: `apps/api/src/mvp.store.ts`

- [ ] **Step 1: OTP 인터페이스 삭제, 로그인 인터페이스 추가**

파일 273–280번째 줄에 있는 `AuthOtpRequestInput`, `AuthOtpVerifyInput` 인터페이스를 삭제하고 아래 두 인터페이스로 교체한다:

```typescript
export interface AuthLoginInput {
  phoneNumber: string;
  password: string;
}

export interface ResetMemberPasswordInput {
  password: string;
}
```

- [ ] **Step 2: `AdminMemberListItem`에 `password` 추가**

`AdminMemberListItem` 인터페이스 (83번째 줄)에 `password: string` 필드를 추가한다:

```typescript
export interface AdminMemberListItem {
  id: string;
  name: string;
  phoneNumber: string;
  birthDate?: string;
  gender?: string;
  role: ClubRole;
  memberStatus: MemberStatus;
  joinedAt: string;
  leftAt?: string;
  personalDataDeleteAt?: string;
  lastFeeStatus: FeePaymentStatus;
  attendanceRate: number;
  password: string;
}
```

- [ ] **Step 3: `CreateAdminMemberInput`에 `password` 추가**

```typescript
export interface CreateAdminMemberInput {
  name: string;
  phoneNumber: string;
  role?: ClubRole;
  password?: string;
}
```

- [ ] **Step 4: `UpdateAdminMemberInput`에 `password` 추가**

```typescript
export interface UpdateAdminMemberInput {
  name?: string;
  phoneNumber?: string;
  role?: ClubRole;
  memberStatus?: MemberStatus;
  lastFeeStatus?: FeePaymentStatus;
  password?: string;
}
```

- [ ] **Step 5: `otpCodes` 변수 제거**

아래 줄을 삭제한다:
```typescript
export const otpCodes = new Map<string, { code: string; expiresAt: string }>();
```

- [ ] **Step 6: `createMemberFromProfile()` 수정 — password 초기화 추가**

기존 함수를 아래로 교체한다 (전화번호 뒤 4자리를 초기 패스워드로 설정):

```typescript
export function createMemberFromProfile(name: string, phoneNumber: string): AdminMemberListItem {
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const nextMember: AdminMemberListItem = {
    id: `member-${Date.now()}`,
    name,
    phoneNumber,
    role: "member",
    memberStatus: "active",
    joinedAt: new Date().toISOString().slice(0, 10),
    lastFeeStatus: "unpaid",
    attendanceRate: 0,
    password: phoneDigits.slice(-4),
  };

  members.push(nextMember);
  clubMemberships.push({
    clubId: club.id,
    memberId: nextMember.id,
    role: "member",
    memberStatus: "active",
    joinedAt: nextMember.joinedAt,
  });
  initializeMemberState(nextMember);
  return nextMember;
}
```

- [ ] **Step 7: `hydrateStore()`에 기존 멤버 패스워드 백필 추가**

`hydrateStore()` 함수에서 `replaceArray(members, store.members);` 바로 다음 줄에 아래 코드를 추가한다. Railway 재배포 시 기존 JSON에 password 필드가 없는 멤버에게 전화번호 뒤 4자리를 부여한다:

```typescript
for (const member of members) {
  if (!member.password) {
    const digits = member.phoneNumber.replace(/\D/g, "");
    member.password = digits.slice(-4);
  }
}
```

- [ ] **Step 8: 타입 체크 확인**

```
cd apps/api && npm run typecheck
```

Expected: 오류 0개. `otpCodes` 관련 오류가 나오면 Step 5가 누락된 것.

- [ ] **Step 9: 커밋**

```bash
git add apps/api/src/mvp.store.ts
git commit -m "feat(api): add password field to member types, remove OTP types"
```

---

### Task 2: API — Repository 변경 (`mvp.repository.ts`)

**Files:**
- Modify: `apps/api/src/mvp.repository.ts`

- [ ] **Step 1: import 변경**

파일 상단 import 블록에서 아래를 삭제한다:
```typescript
  type AuthOtpRequestInput,
  type AuthOtpVerifyInput,
  ...
  otpCodes,
```

아래를 추가한다:
```typescript
  type AuthLoginInput,
  type ResetMemberPasswordInput,
```

- [ ] **Step 2: `MvpRepository` abstract 클래스 변경**

abstract 클래스 (110번째 줄 근처)에서 아래 두 줄을 삭제한다:
```typescript
  abstract requestOtp(input: AuthOtpRequestInput): {
    data: { phoneNumber: string; code: string; expiresAt: string };
    meta: { mode: "development" };
  };
  abstract verifyOtp(input: AuthOtpVerifyInput): unknown;
```

그 자리에 아래 두 줄을 추가한다:
```typescript
  abstract login(input: AuthLoginInput): unknown;
  abstract resetMemberPassword(memberId: string, input: ResetMemberPasswordInput): unknown;
```

- [ ] **Step 3: `JsonMvpRepository`에서 `requestOtp()` 메서드 삭제**

`requestOtp()` 구현 메서드 전체 (176–197번째 줄)를 삭제한다.

- [ ] **Step 4: `verifyOtp()` 메서드 삭제, `login()` 추가**

`verifyOtp()` 구현 메서드 전체 (199–229번째 줄)를 삭제하고, 그 자리에 아래 `login()` 메서드를 추가한다:

```typescript
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
```

- [ ] **Step 5: `resetMemberPassword()` 추가**

`login()` 메서드 바로 다음에 추가한다:

```typescript
  resetMemberPassword(memberId: string, input: ResetMemberPasswordInput) {
    const member = findMember(memberId);
    const newPassword = `${input.password ?? ""}`.trim();

    if (!newPassword) {
      throw new BadRequestException("비밀번호를 입력하세요.");
    }

    member.password = newPassword;
    persistStore();
    return { memberId: member.id };
  }
```

- [ ] **Step 6: `createMember()` 수정 — password 처리 추가**

`createMember()` 메서드의 `nextMember` 객체에 `password` 필드를 추가한다:

```typescript
  createMember(clubId: string, input: CreateAdminMemberInput) {
    ensureClub(clubId);
    const phoneDigits = input.phoneNumber.trim().replace(/\D/g, "");
    const nextMember: AdminMemberListItem = {
      id: `member-${Date.now()}`,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
      role: isClubRole(input.role) ? input.role : "member",
      memberStatus: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
      lastFeeStatus: "unpaid",
      attendanceRate: 0,
      password: input.password?.trim() || phoneDigits.slice(-4),
    };

    members.push(nextMember);
    clubMemberships.push({
      clubId,
      memberId: nextMember.id,
      role: nextMember.role,
      memberStatus: nextMember.memberStatus,
      joinedAt: nextMember.joinedAt,
    });
    initializeMemberState(nextMember);
    persistStore();
    return nextMember;
  }
```

- [ ] **Step 7: `updateMember()` 수정 — password 처리 추가**

`updateMember()` 메서드에서 `persistStore()` 호출 바로 전에 아래를 추가한다:

```typescript
    if (typeof input.password === "string" && input.password.trim()) {
      member.password = input.password.trim();
    }
```

결과적으로 `updateMember()` 끝 부분이 다음과 같아야 한다:

```typescript
    if (isFeePaymentStatus(input.lastFeeStatus)) {
      member.lastFeeStatus = input.lastFeeStatus;
      feePayments[fees[0].id][member.id] = input.lastFeeStatus;
    }

    if (typeof input.password === "string" && input.password.trim()) {
      member.password = input.password.trim();
    }

    persistStore();
    return member;
  }
```

- [ ] **Step 8: `importMembers()` 수정 — password 컬럼 파싱 추가**

`importMembers()` 메서드에서 컬럼 구조분해 할당을 수정하고 `createMember` 호출 시 `password`를 전달한다:

```typescript
  importMembers(clubId: string, input: ImportAdminMembersInput): ImportAdminMembersResult {
    ensureClub(clubId);

    const errors: ImportAdminMembersResult["errors"] = [];
    const importedMembers: AdminMemberListItem[] = [];
    const rows = `${input.rows ?? ""}`
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean);

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 1;
      const columns = row.split(/\t|,/).map((column) => column.trim());
      const [name, phoneNumber, roleValue, passwordValue] = columns;  // 4번째 컬럼 추가

      if (!name || !phoneNumber) {
        errors.push({ row: rowNumber, reason: "Name and phone number are required", value: row });
        continue;
      }

      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
      const duplicate = visibleMembers(clubId).some(
        (member) => normalizePhoneNumber(member.phoneNumber) === normalizedPhoneNumber,
      );

      if (duplicate) {
        errors.push({ row: rowNumber, reason: "Duplicate phone number", value: row });
        continue;
      }

      const role = isClubRole(roleValue) ? roleValue : "member";
      const member = this.createMember(clubId, {
        name,
        phoneNumber: normalizedPhoneNumber,
        role,
        password: passwordValue?.trim() || undefined,  // 미입력 시 createMember에서 전화번호 뒤 4자리로 처리
      });
      importedMembers.push(member);
    }

    return {
      createdCount: importedMembers.length,
      skippedCount: errors.length,
      errors,
      members: importedMembers,
    };
  }
```

- [ ] **Step 9: `acceptInvite()` 수정 — password 초기화 추가**

`acceptInvite()` 메서드에서 `member` 객체 생성 시 `password` 필드를 추가한다. `phoneDigits` 변수도 추가한다:

```typescript
  acceptInvite(clubId: string, token: string, input: AcceptInviteInput) {
    ensureClub(clubId);
    const invite = findInviteByToken(token);
    if (Date.parse(`${invite.expiresAt}T23:59:59+09:00`) < Date.now()) {
      throw new NotFoundException("Invite link expired");
    }

    const phoneDigits = input.applicantPhone.trim().replace(/\D/g, "");
    const member: AdminMemberListItem = {
      id: `member-${Date.now()}`,
      name: input.applicantName.trim(),
      phoneNumber: input.applicantPhone.trim(),
      role: "member",
      memberStatus: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
      lastFeeStatus: "unpaid",
      attendanceRate: 0,
      password: phoneDigits.slice(-4),
    };

    members.push(member);
    clubMemberships.push({
      clubId,
      memberId: member.id,
      role: "member",
      memberStatus: "active",
      joinedAt: member.joinedAt,
    });
    initializeMemberState(member);
    persistStore();
    return member;
  }
```

- [ ] **Step 10: 타입 체크 확인**

```
cd apps/api && npm run typecheck
```

Expected: 오류 0개.

- [ ] **Step 11: 커밋**

```bash
git add apps/api/src/mvp.repository.ts
git commit -m "feat(api): replace OTP methods with login/resetPassword in repository"
```

---

### Task 3: API — Controller 변경 (`app.controller.ts`)

**Files:**
- Modify: `apps/api/src/app.controller.ts`

- [ ] **Step 1: import 변경**

import 블록에서 아래 두 줄을 삭제한다:
```typescript
  type AuthOtpRequestInput,
  type AuthOtpVerifyInput,
```

아래 두 줄을 추가한다:
```typescript
  type AuthLoginInput,
  type ResetMemberPasswordInput,
```

- [ ] **Step 2: `requestOtp` 핸들러 삭제, `login` 핸들러 추가**

기존 `requestOtp` 핸들러를 삭제한다:
```typescript
  @Post("auth/otp/request")
  requestOtp(@Body() input: AuthOtpRequestInput) {
    return this.repository.requestOtp(input);
  }
```

그 자리에 `login` 핸들러를 추가한다:
```typescript
  @Post("auth/login")
  login(@Body() input: AuthLoginInput) {
    return { data: this.repository.login(input) };
  }
```

- [ ] **Step 3: `verifyOtp` 핸들러 삭제, `resetMemberPassword` 핸들러 추가**

기존 `verifyOtp` 핸들러 (81–84번째 줄)를 삭제한다:
```typescript
  @Post("auth/otp/verify")
  verifyOtp(@Body() input: AuthOtpVerifyInput) {
    return { data: this.repository.verifyOtp(input) };
  }
```

멤버 관련 엔드포인트 근처(어디든 자연스러운 위치)에 `resetMemberPassword` 핸들러를 추가한다:
```typescript
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

- [ ] **Step 4: 타입 체크 확인**

```
cd apps/api && npm run typecheck
```

Expected: 오류 0개.

- [ ] **Step 5: 커밋**

```bash
git add apps/api/src/app.controller.ts
git commit -m "feat(api): replace OTP endpoints with POST /auth/login and PATCH .../password"
```

---

### Task 4: 모바일 앱 — API 클라이언트 변경 (`member_api_client.dart`)

**Files:**
- Modify: `apps/mobile-app/lib/member_api_client.dart`

- [ ] **Step 1: `requestOtp()` 메서드 삭제**

아래 메서드 전체를 삭제한다:
```dart
  Future<bool> requestOtp(String phoneNumber) async {
    return _sendJson(
      'POST',
      Uri.parse('$apiBaseUrl/auth/otp/request'),
      {'phoneNumber': phoneNumber},
    );
  }
```

- [ ] **Step 2: `verifyOtp()` 메서드 삭제, `login()` 추가**

`verifyOtp()` 메서드 전체를 삭제하고, 그 자리에 아래 `login()` 메서드를 추가한다:

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

- [ ] **Step 3: 분석 확인**

```
cd apps/mobile-app && flutter analyze
```

Expected: 오류/경고 0개.

- [ ] **Step 4: 커밋**

```bash
git add apps/mobile-app/lib/member_api_client.dart
git commit -m "feat(mobile): replace OTP API calls with login method"
```

---

### Task 5: 모바일 앱 — 인증 흐름 변경 (`main.dart`)

**Files:**
- Modify: `apps/mobile-app/lib/main.dart`

- [ ] **Step 1: `_requestOtp()` 메서드 삭제**

아래 메서드 전체 (139–148번째 줄)를 삭제한다:
```dart
  Future<String?> _requestOtp(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty) {
      return '휴대폰 번호를 입력하세요.';
    }

    final requested = await _api.requestOtp(phoneNumber);
    return requested
        ? '인증번호가 발송되었습니다.'
        : '인증번호 요청에 실패했습니다. 잠시 후 다시 시도하세요.';
  }
```

- [ ] **Step 2: `_verifyOtp()` 메서드 삭제, `_login()` 추가**

`_verifyOtp()` 메서드 전체 (150–178번째 줄)를 삭제하고, 그 자리에 아래 `_login()` 메서드를 추가한다:

```dart
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

- [ ] **Step 3: `build()`에서 `AuthPage` 사용부 변경**

`build()` 메서드 내 `!_isAuthenticated` 분기 (393–396번째 줄)를 아래로 교체한다:

```dart
// 변경 전
      return AuthPage(
        onOtpRequested: _requestOtp,
        onVerified: _verifyOtp,
      );

// 변경 후
      return AuthPage(onLogin: _login);
```

- [ ] **Step 4: 분석 확인**

```
cd apps/mobile-app && flutter analyze
```

Expected: 오류 0개.

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile-app/lib/main.dart
git commit -m "feat(mobile): replace OTP callbacks with _login in HomeShell"
```

---

### Task 6: 모바일 앱 — UI 수정 (`member_ui.dart` + `auth_page.dart`)

**Files:**
- Modify: `apps/mobile-app/lib/member_ui.dart`
- Modify: `apps/mobile-app/lib/screens/auth_page.dart`

- [ ] **Step 1: `TextInput`에 `obscureText` 파라미터 추가**

`apps/mobile-app/lib/member_ui.dart`의 `TextInput` 위젯에 `obscureText` 파라미터를 추가한다. 기존 위젯을 아래로 교체한다:

```dart
class TextInput extends StatelessWidget {
  const TextInput({
    super.key,
    required this.controller,
    required this.label,
    this.keyboardType,
    this.obscureText = false,
  });

  final TextEditingController controller;
  final String label;
  final TextInputType? keyboardType;
  final bool obscureText;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        decoration: InputDecoration(
          border: const OutlineInputBorder(),
          labelText: label,
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: `auth_page.dart` 전체 재작성**

`apps/mobile-app/lib/screens/auth_page.dart` 파일 전체를 아래로 교체한다:

```dart
import 'package:flutter/material.dart';

import '../member_ui.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key, required this.onLogin});

  final Future<bool> Function(String phoneNumber, String password) onLogin;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _errorMessage;
  bool _busy = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    final success = await widget.onLogin(
      _phoneController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    setState(() {
      _busy = false;
      _errorMessage = success ? null : '전화번호 또는 비밀번호를 확인하세요.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 24),
            Text(
              '로그인',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: starbucksGreen,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '전화번호와 비밀번호를 입력하세요.',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: textBlackSoft),
            ),
            const SizedBox(height: 24),
            InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextInput(
                    controller: _phoneController,
                    label: '전화번호',
                    keyboardType: TextInputType.phone,
                  ),
                  TextInput(
                    controller: _passwordController,
                    label: '비밀번호',
                    obscureText: true,
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: const Text('로그인'),
                    ),
                  ),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _errorMessage!,
                      style: const TextStyle(color: red),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: 분석 확인**

```
cd apps/mobile-app && flutter analyze
```

Expected: 오류 0개.

- [ ] **Step 4: 커밋**

```bash
git add apps/mobile-app/lib/member_ui.dart apps/mobile-app/lib/screens/auth_page.dart
git commit -m "feat(mobile): rewrite auth screen as single-step login form"
```

---

### Task 7: 관리자 웹 — 비밀번호 기능 추가 (`admin.tsx` + `members/page.tsx`)

**Files:**
- Modify: `apps/admin-web/app/admin.tsx`
- Modify: `apps/admin-web/app/members/page.tsx`

- [ ] **Step 1: `admin.tsx` — `createMemberAction`에 password 추가**

`createMemberAction` 함수 (157번째 줄)의 `body` JSON에 `password` 필드를 추가한다:

```typescript
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
      password: formData.get("password") || undefined,
    }),
  });

  revalidateAdmin();
}
```

- [ ] **Step 2: `admin.tsx` — `resetMemberPasswordAction` 추가**

`updateMemberAction` 함수 다음에 아래 함수를 추가한다:

```typescript
export async function resetMemberPasswordAction(memberId: string, formData: FormData) {
  "use server";

  const clubId = await getActiveClubId();
  await fetch(`${apiBaseUrl}/clubs/${clubId}/members/${memberId}/password`, {
    method: "PATCH",
    headers: adminJsonHeaders,
    body: JSON.stringify({ password: formData.get("password") }),
  });

  revalidateAdmin();
}
```

- [ ] **Step 3: `members/page.tsx` — import에 `resetMemberPasswordAction` 추가**

import 목록에 `resetMemberPasswordAction`을 추가한다:

```typescript
import {
  AdminShell,
  PageTitle,
  UnauthorizedPanel,
  createMemberAction,
  feeStatusLabels,
  formatDate,
  getOverview,
  importMembersAction,
  memberStatusLabels,
  removeMemberAction,
  resetMemberPasswordAction,
  roleLabels,
  updateMemberAction,
} from "../admin";
```

- [ ] **Step 4: `members/page.tsx` — 회원 추가 폼에 비밀번호 필드 추가**

`createMemberAction` 폼에서 역할 `<label>` 다음, `<button>` 앞에 비밀번호 입력 필드를 추가한다:

```tsx
          <label>
            초기 비밀번호
            <input
              name="password"
              type="text"
              placeholder="미입력 시 전화번호 뒤 4자리"
            />
          </label>
          <button className="primary" type="submit">
            회원 추가
          </button>
```

- [ ] **Step 5: `members/page.tsx` — 회원 목록에 비밀번호 재설정 폼 추가**

회원 목록 map 블록 전체를 아래로 교체한다. 기존 `<form key={member.id}>` 구조를 `<div key={member.id}>` 래퍼로 감싸고, 그 안에 기존 폼과 비밀번호 재설정 폼을 나란히 배치한다:

```tsx
          {overview.members.map((member) => (
            <div key={member.id}>
              <form action={updateMemberAction.bind(null, member.id)} className="memberRow">
                <div className="memberIdentity">
                  <strong>{member.name}</strong>
                  <span>
                    {member.phoneNumber} · 가입 {member.joinedAt}
                  </span>
                  {member.personalDataDeleteAt ? (
                    <span className="retentionNotice">개인정보 삭제 예정 {formatDate(member.personalDataDeleteAt)}</span>
                  ) : null}
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
              <form action={resetMemberPasswordAction.bind(null, member.id)} className="memberPasswordResetRow">
                <input name="password" type="text" placeholder="새 비밀번호" required />
                <button className="secondary compact" type="submit">
                  비밀번호 재설정
                </button>
              </form>
            </div>
          ))}
```

- [ ] **Step 6: 타입 체크 확인**

```
cd apps/admin-web && npx tsc --noEmit
```

Expected: 오류 0개.

- [ ] **Step 7: 커밋**

```bash
git add apps/admin-web/app/admin.tsx apps/admin-web/app/members/page.tsx
git commit -m "feat(admin): add password field to member create form and reset action"
```

---

## 완료 후 검증

모든 태스크 완료 후:

1. API 배포 확인: Railway 배포 로그에서 빌드 성공 확인
2. `POST /api/v1/auth/login` 에 `{ phoneNumber, password }` 전송 → `{ data: { memberId, profile, clubs } }` 응답 확인
3. 관리자 웹에서 회원 추가 → 초기 비밀번호로 모바일 앱 로그인 확인
4. 관리자 웹에서 비밀번호 재설정 → 새 비밀번호로 로그인 확인

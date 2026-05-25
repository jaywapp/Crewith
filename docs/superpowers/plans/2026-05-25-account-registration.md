# Crewith 계정 자체 가입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 누구나 전화번호·이름·비밀번호·생년월일로 Crewith 계정을 직접 생성할 수 있도록 한다. 모임 합류는 관리자 초대로만 가능하며, 클럽 없는 상태로 로그인한 사용자에게는 별도 안내 화면을 표시한다.

**Architecture:** 기존 `members[]` 배열을 전역 계정 저장소로 활용하고 `POST /auth/register` 엔드포인트를 추가한다. `acceptInvite`는 기존 계정(전화번호 기준)이 있으면 `clubMembership`만 추가하도록 수정한다. 모바일 앱에는 회원가입 화면(`RegisterPage`)과 클럽 없는 상태 안내 화면(`NoClubPage`)을 신규 추가한다.

**Tech Stack:** NestJS (TypeScript) API · Flutter (Dart) 모바일 앱

---

## File Map

**API (`apps/api/src/`)**
- Modify: `mvp.store.ts` — `RegisterInput` 인터페이스 추가
- Modify: `mvp.repository.ts` — `register()` 추상 메서드 + 구현, `acceptInvite()` 수정
- Modify: `app.controller.ts` — `POST auth/register` 라우트 추가
- Modify: `test/mvp.test.mjs` — register / acceptInvite-reuse 테스트 추가

**Mobile (`apps/mobile-app/lib/`)**
- Modify: `member_api_client.dart` — `register()` 메서드 추가
- Create: `screens/no_club_page.dart` — 클럽 없음 안내 화면
- Create: `screens/register_page.dart` — 회원가입 화면
- Modify: `screens/auth_page.dart` — "회원가입" 링크 추가
- Modify: `main.dart` — 로그인 후 빈 clubs 처리

---

### Task 1: API — `RegisterInput` 인터페이스 추가

**Files:**
- Modify: `apps/api/src/mvp.store.ts` (현재 `AcceptInviteInput` 인터페이스 근처, 약 500~512줄)

- [ ] **Step 1: `RegisterInput` 인터페이스를 `AcceptInviteInput` 바로 아래에 추가**

`apps/api/src/mvp.store.ts`에서 `export interface AcceptInviteInput {` 블록(약 500줄) 바로 뒤에 삽입:

```typescript
export interface RegisterInput {
  name: string;
  phoneNumber: string;
  password: string;
  birthDate?: string;
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```
cd apps/api
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add apps/api/src/mvp.store.ts
git commit -m "feat(api): add RegisterInput interface"
```

---

### Task 2: API — `POST /auth/register` 구현

**Files:**
- Modify: `apps/api/src/mvp.repository.ts` — abstract + concrete 구현
- Modify: `apps/api/src/app.controller.ts` — 라우트

- [ ] **Step 1: `MvpRepository` 추상 클래스에 `register` 메서드 추가**

`apps/api/src/mvp.repository.ts`에서 `@nestjs/common` import에 `ConflictException` 추가:

```typescript
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
```

그리고 `./mvp.store` import 블록에 `RegisterInput` 추가:

```typescript
import {
  // ... 기존 import들 ...
  type RegisterInput,
  // ...
} from "./mvp.store";
```

그리고 `abstract login(...)` 바로 아래에 추가:

```typescript
abstract register(input: RegisterInput): { memberId: string };
```

- [ ] **Step 2: `JsonMvpRepository`에 `register()` 구현 추가**

`login()` 구현 바로 아래(약 190줄)에 추가:

```typescript
register(input: RegisterInput) {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber ?? "");
  const name = `${input.name ?? ""}`.trim();
  const password = `${input.password ?? ""}`.trim();

  if (!name || !phoneNumber || !password) {
    throw new BadRequestException("이름, 전화번호, 비밀번호를 입력하세요.");
  }

  const duplicate = members.find(
    (m) => normalizePhoneNumber(m.phoneNumber) === phoneNumber && m.memberStatus !== "removed",
  );

  if (duplicate) {
    throw new ConflictException("이미 사용 중인 전화번호입니다.");
  }

  const nextMember: AdminMemberListItem = {
    id: `member-${Date.now()}`,
    name,
    phoneNumber,
    birthDate: input.birthDate?.trim() || undefined,
    role: "member",
    memberStatus: "active",
    joinedAt: new Date().toISOString().slice(0, 10),
    lastFeeStatus: "unpaid",
    attendanceRate: 0,
    password,
  };

  members.push(nextMember);
  persistStore();
  return { memberId: nextMember.id };
}
```

- [ ] **Step 3: `app.controller.ts`에 `RegisterInput` import 추가 + 라우트 추가**

`app.controller.ts`의 import에 `RegisterInput` 추가:

```typescript
import {
  // ... 기존 import들 ...
  type RegisterInput,
} from "./mvp.store";
```

그리고 `@Post("auth/login")` 라우트 바로 아래에 추가:

```typescript
@Post("auth/register")
register(@Body() input: RegisterInput) {
  return { data: this.repository.register(input) };
}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```
cd apps/api
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```
git add apps/api/src/mvp.repository.ts apps/api/src/app.controller.ts
git commit -m "feat(api): add POST /auth/register endpoint"
```

---

### Task 3: API — `acceptInvite` 수정 (기존 계정 재사용)

**Files:**
- Modify: `apps/api/src/mvp.repository.ts` (`acceptInvite` 구현, 약 514~544줄)

현재 `acceptInvite`는 무조건 새 멤버를 생성한다. 동일 전화번호의 기존 계정이 있으면 `clubMembership`만 추가하도록 변경한다.

- [ ] **Step 1: `acceptInvite` 구현을 아래 코드로 교체**

```typescript
acceptInvite(clubId: string, token: string, input: AcceptInviteInput) {
  ensureClub(clubId);
  const invite = findInviteByToken(token);
  if (Date.parse(`${invite.expiresAt}T23:59:59+09:00`) < Date.now()) {
    throw new NotFoundException("Invite link expired");
  }

  const normalizedPhone = normalizePhoneNumber(input.applicantPhone.trim());

  const existing = members.find(
    (m) => normalizePhoneNumber(m.phoneNumber) === normalizedPhone && m.memberStatus !== "removed",
  );

  if (existing) {
    const alreadyMember = clubMemberships.find(
      (cm) => cm.clubId === clubId && cm.memberId === existing.id && cm.memberStatus !== "removed",
    );

    if (!alreadyMember) {
      clubMemberships.push({
        clubId,
        memberId: existing.id,
        role: "member",
        memberStatus: "active",
        joinedAt: new Date().toISOString().slice(0, 10),
      });
      initializeMemberState(existing);
    }

    persistStore();
    return existing;
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

- [ ] **Step 2: TypeScript 컴파일 확인**

```
cd apps/api
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add apps/api/src/mvp.repository.ts
git commit -m "feat(api): acceptInvite reuses existing account by phone number"
```

---

### Task 4: API 테스트 추가

**Files:**
- Modify: `apps/api/test/mvp.test.mjs` (기존 2번째 테스트 끝 부분에 추가)

- [ ] **Step 1: 기존 테스트 파일 끝에 register/acceptInvite-reuse 테스트 추가**

`apps/api/test/mvp.test.mjs` 파일 마지막 `});` 앞(두 번째 test 블록 내부)에 아래 코드를 추가한다.

위치: 두 번째 `test(...)` 블록 안에서 마지막 assert 다음, `t.after` 종료 전.

```javascript
  // POST /auth/register — 성공
  const registerResponse = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "신규회원",
      phoneNumber: "010-9999-1234",
      password: "pass1234",
      birthDate: "1995-06-15",
    }),
  });
  assert.equal(registerResponse.status, 201);
  const registeredMemberId = (await registerResponse.json()).data.memberId;
  assert.ok(typeof registeredMemberId === "string" && registeredMemberId.startsWith("member-"));

  // 등록 후 로그인 가능
  const registerLoginResp = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-9999-1234", password: "pass1234" }),
  });
  assert.equal(registerLoginResp.status, 201);
  const registerSession = (await registerLoginResp.json()).data;
  assert.equal(registerSession.memberId, registeredMemberId);
  assert.equal(registerSession.clubs.length, 0); // 클럽 없음

  // 중복 전화번호로 재가입 시도 — 409
  const duplicateRegister = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "중복회원",
      phoneNumber: "010-9999-1234",
      password: "other",
    }),
  });
  assert.equal(duplicateRegister.status, 409);

  // acceptInvite — 이미 가입된 전화번호이면 기존 계정에 clubMembership만 추가
  // 먼저 초대 링크 생성
  const createInviteForReuse = await fetch(`${baseUrl}/clubs/club-seoul-runners/invite-links`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-crewith-role": "operator" },
    body: JSON.stringify({ expiresInDays: 7 }),
  });
  assert.equal(createInviteForReuse.status, 201);
  const reuseToken = (await createInviteForReuse.json()).data.token;

  const acceptWithExisting = await fetch(
    `${baseUrl}/clubs/club-seoul-runners/invite-links/${reuseToken}/accept`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        applicantName: "신규회원",
        applicantPhone: "010-9999-1234",
      }),
    },
  );
  assert.equal(acceptWithExisting.status, 201);
  const reuseResult = (await acceptWithExisting.json()).data;
  assert.equal(reuseResult.id, registeredMemberId); // 기존 계정 반환

  // 이제 로그인하면 클럽이 1개
  const afterInviteLogin = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phoneNumber: "010-9999-1234", password: "pass1234" }),
  });
  const afterSession = (await afterInviteLogin.json()).data;
  assert.equal(afterSession.clubs.length, 1);
  assert.equal(afterSession.clubs[0].clubId, "club-seoul-runners");
```

- [ ] **Step 2: 빌드 후 테스트 실행**

```
cd apps/api
npm run build
node --test test/mvp.test.mjs
```

Expected: 모든 테스트 PASS

- [ ] **Step 3: 커밋**

```
git add apps/api/test/mvp.test.mjs
git commit -m "test(api): add register and acceptInvite-reuse tests"
```

---

### Task 5: Mobile — `MemberApiClient.register()` 추가

**Files:**
- Modify: `apps/mobile-app/lib/member_api_client.dart`

- [ ] **Step 1: `login()` 메서드 바로 아래에 `register()` 추가**

```dart
Future<String?> register({
  required String name,
  required String phoneNumber,
  required String password,
  String? birthDate,
}) async {
  final client = _client();
  try {
    final request = await client.postUrl(Uri.parse('$apiBaseUrl/auth/register'));
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode({
      'name': name,
      'phoneNumber': phoneNumber,
      'password': password,
      if (birthDate != null && birthDate.isNotEmpty) 'birthDate': birthDate,
    }));
    final response = await request.close().timeout(const Duration(seconds: 15));
    if (response.statusCode == HttpStatus.created) {
      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return (json['data'] as Map<String, dynamic>)['memberId'] as String;
    }
    // 400: duplicate phone → null
    return null;
  } catch (_) {
    return null;
  } finally {
    client.close(force: true);
  }
}
```

- [ ] **Step 2: Flutter 분석 실행**

```
cd apps/mobile-app
flutter analyze lib/member_api_client.dart
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add apps/mobile-app/lib/member_api_client.dart
git commit -m "feat(mobile): add MemberApiClient.register()"
```

---

### Task 6: Mobile — `NoClubPage` 신규 생성

**Files:**
- Create: `apps/mobile-app/lib/screens/no_club_page.dart`

- [ ] **Step 1: 파일 생성**

```dart
import 'package:flutter/material.dart';

import '../member_ui.dart';

class NoClubPage extends StatelessWidget {
  const NoClubPage({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Crewith',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: starbucksGreen,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 24),
                const Text(
                  '아직 참여 중인 모임이 없습니다.\n관리자의 초대를 기다려주세요.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                OutlinedButton(
                  onPressed: onLogout,
                  child: const Text('로그아웃'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Flutter 분석**

```
cd apps/mobile-app
flutter analyze lib/screens/no_club_page.dart
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add apps/mobile-app/lib/screens/no_club_page.dart
git commit -m "feat(mobile): add NoClubPage"
```

---

### Task 7: Mobile — `RegisterPage` 신규 생성

**Files:**
- Create: `apps/mobile-app/lib/screens/register_page.dart`

- [ ] **Step 1: 파일 생성**

```dart
import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_ui.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key, required this.api});

  final MemberApiClient api;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _birthDateController = TextEditingController();
  String? _errorMessage;
  bool _busy = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _birthDateController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();

    if (name.isEmpty || phone.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = '이름, 전화번호, 비밀번호를 입력하세요.');
      return;
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    final memberId = await widget.api.register(
      name: name,
      phoneNumber: phone,
      password: password,
      birthDate: _birthDateController.text.trim().isEmpty
          ? null
          : _birthDateController.text.trim(),
    );

    if (!mounted) return;

    setState(() => _busy = false);

    if (memberId != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('가입 완료. 로그인해주세요.')),
      );
      Navigator.of(context).pop();
    } else {
      setState(() => _errorMessage = '이미 사용 중인 전화번호입니다.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('회원가입')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextInput(
                    controller: _nameController,
                    label: '이름',
                  ),
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
                  TextInput(
                    controller: _birthDateController,
                    label: '생년월일 (선택)',
                    hint: 'YYYY-MM-DD',
                    keyboardType: TextInputType.datetime,
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: const Text('가입하기'),
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

- [ ] **Step 2: `TextInput` 위젯에 `hint` 파라미터 지원 여부 확인**

`apps/mobile-app/lib/member_ui.dart`에서 `TextInput` 위젯을 찾아 `hint` 파라미터가 없으면 추가한다.

`TextInput` 클래스의 생성자와 `build` 메서드 찾기:
```
grep -n "class TextInput" apps/mobile-app/lib/member_ui.dart
```

`hint` 파라미터가 없으면 생성자에 `this.hint`를 추가하고 `InputDecoration`의 `hintText`에 연결한다:

```dart
// 생성자에 추가:
final String? hint;

// InputDecoration에 추가:
hintText: hint,
```

- [ ] **Step 3: Flutter 분석**

```
cd apps/mobile-app
flutter analyze lib/screens/register_page.dart
```

Expected: 에러 없음 (hint 파라미터 문제가 있으면 Step 2에서 해결)

- [ ] **Step 4: 커밋**

```
git add apps/mobile-app/lib/screens/register_page.dart apps/mobile-app/lib/member_ui.dart
git commit -m "feat(mobile): add RegisterPage and hint support to TextInput"
```

---

### Task 8: Mobile — `AuthPage` 회원가입 링크 추가

**Files:**
- Modify: `apps/mobile-app/lib/screens/auth_page.dart`

현재 `AuthPage`는 `onLogin` 콜백만 받는다. `RegisterPage`로 이동하려면 `api` 인스턴스가 필요하다.

- [ ] **Step 1: `AuthPage`에 `api` 파라미터 추가 + 회원가입 링크 삽입**

```dart
import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_ui.dart';
import 'register_page.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key, required this.onLogin, required this.api});

  final Future<bool> Function(String phoneNumber, String password) onLogin;
  final MemberApiClient api;

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
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '아직 계정이 없으신가요?',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: textBlackSoft),
                ),
                TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => RegisterPage(api: widget.api),
                    ),
                  ),
                  child: const Text('회원가입'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Flutter 분석**

```
cd apps/mobile-app
flutter analyze lib/screens/auth_page.dart
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add apps/mobile-app/lib/screens/auth_page.dart
git commit -m "feat(mobile): add register link to AuthPage"
```

---

### Task 9: Mobile — `main.dart` 빈 clubs 처리

**Files:**
- Modify: `apps/mobile-app/lib/main.dart`

로그인 성공 후 `session.clubs`가 비어있으면 `_defaultClubs`를 폴백으로 쓰던 로직을 제거하고 `NoClubPage`를 표시한다. `AuthPage`에 `api` 파라미터가 추가되었으므로 전달도 필요하다.

- [ ] **Step 1: `main.dart` 전체를 아래로 교체**

```dart
import 'package:flutter/material.dart';

import 'member_api_client.dart';
import 'member_models.dart';
import 'member_ui.dart';
import 'screens/auth_page.dart';
import 'screens/events_page.dart';
import 'screens/fees_page.dart';
import 'screens/home_page.dart';
import 'screens/members_page.dart';
import 'screens/more_page.dart';
import 'screens/no_club_page.dart';
import 'screens/notices_page.dart';
import 'screens/notifications_page.dart';
import 'screens/splash_screen.dart';

const _defaultMemberId = 'member-03';
const _defaultClubId = 'club-seoul-runners';

void main() {
  runApp(const CrewithApp());
}

class CrewithApp extends StatelessWidget {
  const CrewithApp({super.key, this.api});

  final MemberApiClient? api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Crewith',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          surface: canvas,
          primary: greenAccent,
          onPrimary: white,
          secondary: starbucksGreen,
          tertiary: gold,
          error: red,
          onSurface: textBlack,
        ),
        scaffoldBackgroundColor: canvas,
        fontFamily: 'Inter',
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            shape: const StadiumBorder(),
            backgroundColor: greenAccent,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            shape: const StadiumBorder(),
          ),
        ),
        navigationBarTheme: const NavigationBarThemeData(
          backgroundColor: white,
          indicatorColor: greenLight,
        ),
      ),
      home: SplashScreen(onComplete: (_) => HomeShell(api: api)),
    );
  }
}

class HomeShell extends StatefulWidget {
  HomeShell({super.key, MemberApiClient? api})
      : _api = api ?? const MemberApiClient();

  final MemberApiClient _api;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  bool _isAuthenticated = false;
  bool _hasClub = false;
  String _activeMemberId = _defaultMemberId;
  String _activeClubId = _defaultClubId;
  List<ClubSummary> _clubs = const [];
  MemberApiClient get _api => widget._api;
  late Future<MemberAppOverview> _overviewFuture;
  late Future<List<MemberDirectoryItem>> _memberDirectoryFuture;
  late Future<List<MemberNotification>> _notificationsFuture;

  @override
  void initState() {
    super.initState();
    _overviewFuture = Future.value(const MemberAppOverview(
      clubName: '', sportType: '', memberName: '', fees: [], events: [], notices: [],
    ));
    _memberDirectoryFuture = Future.value(const []);
    _notificationsFuture = Future.value(const []);
  }

  Future<MemberAppOverview> _fetchOverview([String? memberId]) async {
    await WidgetsBinding.instance.endOfFrame;
    return _api.fetchOverview(
      clubId: _activeClubId,
      memberId: memberId ?? _activeMemberId,
    );
  }

  Future<List<MemberDirectoryItem>> _fetchMemberDirectory([String? memberId]) async {
    await WidgetsBinding.instance.endOfFrame;
    return _api.fetchMemberDirectory(
      clubId: _activeClubId,
      memberId: memberId ?? _activeMemberId,
    );
  }

  void _refreshOverview() {
    setState(() {
      _overviewFuture = _fetchOverview(_activeMemberId);
      _memberDirectoryFuture = _fetchMemberDirectory(_activeMemberId);
    });
  }

  Future<List<MemberNotification>> _fetchNotifications([String? memberId]) {
    return _api.fetchNotifications(memberId: memberId ?? _activeMemberId);
  }

  void _refreshNotifications() {
    setState(() {
      _notificationsFuture = _fetchNotifications(_activeMemberId);
    });
  }

  Future<bool> _login(String phoneNumber, String password) async {
    final session = await _api.login(phoneNumber, password);
    if (session == null || !mounted) return false;

    if (session.clubs.isEmpty) {
      setState(() {
        _activeMemberId = session.memberId;
        _clubs = const [];
        _isAuthenticated = true;
        _hasClub = false;
      });
      return true;
    }

    final nextClubId = session.clubs.any((c) => c.clubId == _activeClubId)
        ? _activeClubId
        : session.clubs.first.clubId;

    setState(() {
      _activeMemberId = session.memberId;
      _clubs = session.clubs;
      _activeClubId = nextClubId;
      _isAuthenticated = true;
      _hasClub = true;
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

  void _logout() {
    setState(() {
      _isAuthenticated = false;
      _hasClub = false;
      _activeMemberId = _defaultMemberId;
      _activeClubId = _defaultClubId;
      _clubs = const [];
    });
  }

  Future<String> _updateProfile(String name, String profileImageUrl) async {
    if (name.trim().isEmpty) {
      return '이름을 입력하세요.';
    }

    final saved = await _api.updateProfile(
      _activeMemberId,
      name: name,
      profileImageUrl: profileImageUrl,
    );

    _replaceOverview((value) => value.updateMemberName(name.trim()));
    _refreshOverview();
    return saved ? '프로필을 저장했습니다.' : '저장에 실패했습니다. 다시 시도하세요.';
  }

  Future<String?> _updateEventResponse(String eventId, String response) async {
    _replaceOverview((value) => value.updateEventResponse(eventId, response));

    final saved = await _api.updateEventResponse(
      clubId: _activeClubId,
      eventId: eventId,
      memberId: _activeMemberId,
      response: response,
    );

    if (saved) {
      _refreshOverview();
      return '참석 의사를 저장했습니다.';
    }

    return '연결 실패. 다시 시도하세요.';
  }

  Future<String?> _markNoticeRead(String noticeId) async {
    _replaceOverview((value) => value.markNoticeRead(noticeId));

    final saved = await _api.markNoticeRead(
      clubId: _activeClubId,
      noticeId: noticeId,
      memberId: _activeMemberId,
    );

    if (saved) {
      _refreshOverview();
      return '공지 확인 상태를 저장했습니다.';
    }

    return '연결 실패. 다시 시도하세요.';
  }

  Future<String?> _toggleNoticeReaction(String noticeId) async {
    _replaceOverview((value) => value.toggleNoticeReaction(noticeId));

    final saved = await _api.toggleNoticeReaction(
      clubId: _activeClubId,
      noticeId: noticeId,
      memberId: _activeMemberId,
    );

    if (saved) {
      _refreshOverview();
      return '좋아요를 저장했습니다.';
    }

    return '연결 실패. 다시 시도하세요.';
  }

  Future<String?> _createNoticeComment(String noticeId, String body) async {
    if (body.trim().isEmpty) {
      return null;
    }

    _replaceOverview(
      (value) => value.addNoticeComment(
        noticeId,
        value.memberName,
        body.trim(),
      ),
    );

    final saved = await _api.createNoticeComment(
      clubId: _activeClubId,
      noticeId: noticeId,
      memberId: _activeMemberId,
      body: body.trim(),
    );

    if (saved) {
      _refreshOverview();
      return '댓글을 등록했습니다.';
    }

    return '연결 실패. 다시 시도하세요.';
  }

  Future<String?> _markNotificationRead(String notificationId) async {
    setState(() {
      _notificationsFuture = _notificationsFuture.then(
        (notifications) => notifications
            .map(
              (notification) => notification.id == notificationId
                  ? notification.markRead()
                  : notification,
            )
            .toList(),
      );
    });

    final saved = await _api.markNotificationRead(
      memberId: _activeMemberId,
      notificationId: notificationId,
    );

    if (saved) {
      _refreshNotifications();
      return '알림을 읽음 처리했습니다.';
    }

    return '연결 실패. 다시 시도하세요.';
  }

  Future<String> _createJoinRequest(
    String name,
    String phoneNumber,
    String greeting,
  ) async {
    if (name.trim().isEmpty ||
        phoneNumber.trim().isEmpty ||
        greeting.trim().isEmpty) {
      return '이름, 휴대폰 번호, 가입 인사를 입력하세요.';
    }

    final saved = await _api.createJoinRequest(
      clubId: _activeClubId,
      name: name,
      phoneNumber: phoneNumber,
      greeting: greeting,
    );

    return saved ? '가입 신청을 접수했습니다.' : '가입 신청 저장에 실패했습니다.';
  }

  Future<String> _submitFeedback({
    required String title,
    required String body,
    required String category,
  }) async {
    if (title.trim().isEmpty || body.trim().isEmpty) {
      return '제목과 내용을 모두 입력하세요.';
    }

    final sent = await _api.submitFeedback(
      title: title.trim(),
      body: body.trim(),
      category: category,
      memberId: _activeMemberId,
    );

    return sent ? '피드백이 접수되었습니다. 감사합니다!' : '피드백 전송에 실패했습니다.';
  }

  Future<String> _acceptInvite(
    String token,
    String name,
    String phoneNumber,
  ) async {
    if (token.trim().isEmpty ||
        name.trim().isEmpty ||
        phoneNumber.trim().isEmpty) {
      return '초대 코드, 이름, 휴대폰 번호를 입력하세요.';
    }

    final saved = await _api.acceptInvite(
      clubId: _activeClubId,
      token: token,
      name: name,
      phoneNumber: phoneNumber,
    );

    if (saved) {
      _refreshOverview();
      return '초대 코드로 가입했습니다.';
    }

    return '초대 코드 확인에 실패했습니다.';
  }

  void _replaceOverview(
    MemberAppOverview Function(MemberAppOverview value) update,
  ) {
    setState(() {
      _overviewFuture = _overviewFuture.then(update);
    });
  }

  void _changeClub(String clubId) {
    if (clubId == _activeClubId) {
      return;
    }

    setState(() {
      _activeClubId = clubId;
      _overviewFuture = _fetchOverview(_activeMemberId);
      _memberDirectoryFuture = _fetchMemberDirectory(_activeMemberId);
      _notificationsFuture = _fetchNotifications(_activeMemberId);
      _index = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return AuthPage(onLogin: _login, api: _api);
    }

    if (!_hasClub) {
      return NoClubPage(onLogout: _logout);
    }

    return FutureBuilder<MemberAppOverview>(
      future: _overviewFuture,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('연결에 실패했습니다.'),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _refreshOverview,
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            ),
          );
        }

        final overview = snapshot.data ?? const MemberAppOverview(
          clubName: '', sportType: '', memberName: '', fees: [], events: [], notices: [],
        );
        final activeClub = _clubs.firstWhere(
          (club) => club.clubId == _activeClubId,
          orElse: () => _clubs.first,
        );
        final pages = [
          HomePage(
            overview: overview,
            clubs: _clubs,
            activeClubId: _activeClubId,
            onClubChanged: _changeClub,
          ),
          EventsPage(
            overview: overview,
            onResponseChanged: _updateEventResponse,
          ),
          NoticesPage(
            overview: overview,
            onRead: _markNoticeRead,
            onReactionToggled: _toggleNoticeReaction,
            onCommentCreated: _createNoticeComment,
          ),
          FeesPage(overview: overview),
          FutureBuilder<List<MemberDirectoryItem>>(
            future: _memberDirectoryFuture,
            builder: (context, directorySnapshot) {
              if (directorySnapshot.hasError) {
                return const Center(child: Text('구성원 정보를 불러오지 못했습니다.'));
              }
              return MembersPage(
                members: directorySnapshot.data ?? const [],
              );
            },
          ),
          FutureBuilder<List<MemberNotification>>(
            future: _notificationsFuture,
            builder: (context, notificationSnapshot) {
              return NotificationsPage(
                notifications: notificationSnapshot.data ?? const [],
                onRead: _markNotificationRead,
              );
            },
          ),
          MorePage(
            overview: overview,
            clubs: _clubs,
            activeClub: activeClub,
            onClubChanged: _changeClub,
            onProfileSaved: _updateProfile,
            onJoinRequested: _createJoinRequest,
            onInviteAccepted: _acceptInvite,
            onFeedbackSubmitted: _submitFeedback,
          ),
        ];

        return Scaffold(
          body: SafeArea(
            child: IndexedStack(index: _index, children: pages),
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (value) => setState(() => _index = value),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                label: '홈',
              ),
              NavigationDestination(
                icon: Icon(Icons.event_outlined),
                label: '일정',
              ),
              NavigationDestination(
                icon: Icon(Icons.campaign_outlined),
                label: '공지',
              ),
              NavigationDestination(
                icon: Icon(Icons.payments_outlined),
                label: '회비',
              ),
              NavigationDestination(
                icon: Icon(Icons.groups_outlined),
                label: '구성원',
              ),
              NavigationDestination(
                icon: Icon(Icons.notifications_outlined),
                label: '알림',
              ),
              NavigationDestination(
                icon: Icon(Icons.menu_outlined),
                label: '더보기',
              ),
            ],
          ),
        );
      },
    );
  }
}
```

- [ ] **Step 2: Flutter 분석**

```
cd apps/mobile-app
flutter analyze lib/main.dart
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add apps/mobile-app/lib/main.dart
git commit -m "feat(mobile): handle no-club state after login, remove _defaultClubs fallback"
```

---

## 완료 기준

- `npm run build && node --test test/mvp.test.mjs` — 전체 통과
- `flutter analyze` — 에러 없음
- `POST /auth/register` — 신규 전화번호 201, 중복 400
- 회원가입 후 로그인하면 `clubs: []` 반환 → `NoClubPage` 표시
- 초대 수락 시 기존 가입 계정이면 `clubMembership`만 추가
- 로그인 화면 하단 "회원가입" 버튼 → `RegisterPage` 이동

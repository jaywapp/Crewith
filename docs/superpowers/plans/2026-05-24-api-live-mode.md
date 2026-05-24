# API 실제 연동 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Railway API와 실제 연동 — 시드 데이터 폴백 제거, 타임아웃 연장, 에러 상태 UI 추가, 쓰기 실패 메시지 정직하게 교체

**Architecture:** `MemberApiClient`를 `HomeShell`에 주입 가능하도록 변경해 테스트 격리 확보. 타임아웃 연장 후 `fetchOverview`/`fetchMemberDirectory`는 실패 시 예외를 throw. FutureBuilder에서 `hasError` 케이스 추가. 쓰기 실패 시 메시지만 교체(낙관적 UI 유지).

**Tech Stack:** Flutter 3, Dart, `flutter_test`

---

## 수정 파일 목록

- `apps/mobile-app/lib/member_api_client.dart` — 타임아웃, 읽기 실패 예외 처리
- `apps/mobile-app/lib/main.dart` — API 주입, FutureBuilder 에러 UI, 쓰기 메시지
- `apps/mobile-app/test/widget_test.dart` — FakeMemberApiClient, 텍스트 어서션 업데이트

---

## Task 1: `MemberApiClient`를 `HomeShell`에 주입 가능하도록 변경

**Files:**
- Modify: `apps/mobile-app/lib/main.dart`

- [ ] **Step 1: `CrewithApp`에 optional `api` 파라미터 추가**

`main.dart` 31-70행 `CrewithApp` 클래스를 다음으로 교체:

```dart
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
      home: HomeShell(api: api),
    );
  }
}
```

- [ ] **Step 2: `HomeShell`에 `api` 파라미터 추가**

`main.dart` 72-77행 `HomeShell` 클래스를 다음으로 교체:

```dart
class HomeShell extends StatefulWidget {
  HomeShell({super.key, MemberApiClient? api})
      : _api = api ?? const MemberApiClient();

  final MemberApiClient _api;

  @override
  State<HomeShell> createState() => _HomeShellState();
}
```

- [ ] **Step 3: `_HomeShellState`에서 `_api` 필드 제거, getter로 교체**

`_HomeShellState` 클래스 내부에서 다음 줄을 **삭제**:

```dart
final _api = const MemberApiClient();
```

그리고 해당 줄이 있던 자리(85번 행 근처)에 getter 추가:

```dart
MemberApiClient get _api => widget._api;
```

- [ ] **Step 4: 컴파일 확인**

```powershell
cd D:\workspace\Crewith\apps\mobile-app
flutter analyze
```

Expected: No errors.

---

## Task 2: 위젯 테스트에 `_FakeMemberApiClient` 주입

**Files:**
- Modify: `apps/mobile-app/test/widget_test.dart`

- [ ] **Step 1: `widget_test.dart` 전체를 다음으로 교체 (실패 테스트 먼저 작성)**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:crewith_mobile/main.dart';
import 'package:crewith_mobile/member_api_client.dart';
import 'package:crewith_mobile/member_models.dart';

class _FakeMemberApiClient extends MemberApiClient {
  @override
  Future<MemberAppOverview> fetchOverview({
    required String clubId,
    required String memberId,
  }) async =>
      MemberAppOverview.seed();

  @override
  Future<List<MemberDirectoryItem>> fetchMemberDirectory({
    required String clubId,
    required String memberId,
  }) async =>
      MemberDirectoryItem.seedItems;

  @override
  Future<List<MemberNotification>> fetchNotifications({
    required String memberId,
  }) async =>
      const [];

  @override
  Future<bool> requestOtp(String phoneNumber) async => true;

  @override
  Future<AuthSession?> verifyOtp(String phoneNumber, String code) async {
    if (code != '123456') return null;
    return AuthSession(
      memberId: 'member-03',
      clubs: const [
        ClubSummary(
          clubId: 'club-seoul-runners',
          name: '서울 러너스',
          sportType: '러닝',
          role: 'member',
          memberStatus: 'active',
        ),
      ],
    );
  }

  @override
  Future<bool> registerDevice({
    required String memberId,
    required String fcmToken,
    String platform = 'android',
  }) async =>
      true;

  @override
  Future<bool> updateProfile(
    String memberId, {
    required String name,
    required String profileImageUrl,
  }) async =>
      true;

  @override
  Future<bool> updateEventResponse({
    required String clubId,
    required String eventId,
    required String memberId,
    required String response,
  }) async =>
      true;

  @override
  Future<bool> markNoticeRead({
    required String clubId,
    required String noticeId,
    required String memberId,
  }) async =>
      true;

  @override
  Future<bool> toggleNoticeReaction({
    required String clubId,
    required String noticeId,
    required String memberId,
  }) async =>
      true;

  @override
  Future<bool> createNoticeComment({
    required String clubId,
    required String noticeId,
    required String memberId,
    required String body,
  }) async =>
      true;

  @override
  Future<bool> markNotificationRead({
    required String memberId,
    required String notificationId,
  }) async =>
      true;

  @override
  Future<bool> submitFeedback({
    required String title,
    required String body,
    required String category,
    String? memberId,
  }) async =>
      true;

  @override
  Future<bool> createJoinRequest({
    required String clubId,
    required String name,
    required String phoneNumber,
    required String greeting,
  }) async =>
      true;

  @override
  Future<bool> acceptInvite({
    required String clubId,
    required String token,
    required String name,
    required String phoneNumber,
  }) async =>
      true;
}

void main() {
  testWidgets('renders Crewith home shell after phone auth',
      (WidgetTester tester) async {
    await tester.pumpWidget(CrewithApp(api: _FakeMemberApiClient()));
    await tester.pump();

    expect(find.text('휴대폰 인증'), findsOneWidget);
    await tester.tap(find.text('인증 확인'));
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(find.text('서울 러너스'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
    expect(find.text('일정'), findsOneWidget);
    expect(find.text('공지'), findsOneWidget);
    expect(find.text('회비'), findsOneWidget);
    expect(find.text('구성원'), findsOneWidget);
    expect(find.text('알림'), findsOneWidget);

    await tester.tap(find.text('일정'));
    await tester.pumpAndSettle();
    // 시드 데이터: event-01 response='not_attending' → 버튼은 '✅ 참석'
    expect(find.text('✅ 참석'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('공지'));
    await tester.pumpAndSettle();
    // 시드 데이터: notice-01 read=false
    expect(find.text('✔️ 확인 처리'), findsOneWidget);
    expect(find.text('좋아요'), findsOneWidget);

    await tester.tap(find.text('구성원'));
    await tester.pumpAndSettle();
    expect(find.text('박도윤'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('알림'));
    await tester.pumpAndSettle();
    expect(find.text('아직 수신한 알림이 없습니다.'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.menu_outlined));
    await tester.pumpAndSettle();
    expect(find.text('내 모임 정보와 가입 신청을 관리합니다.'), findsOneWidget);
  });

  testWidgets('shows error state when API throws', (WidgetTester tester) async {
    final errorApi = _ErrorMemberApiClient();
    await tester.pumpWidget(CrewithApp(api: errorApi));
    await tester.pump();

    // 인증 통과 (OTP는 항상 성공)
    await tester.tap(find.text('인증 확인'));
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    // fetchOverview가 throw하면 에러 UI가 표시되어야 함
    expect(find.text('연결에 실패했습니다.'), findsOneWidget);
    expect(find.text('다시 시도'), findsOneWidget);
  });
}

// fetchOverview가 예외를 던지는 가짜 클라이언트
class _ErrorMemberApiClient extends _FakeMemberApiClient {
  @override
  Future<MemberAppOverview> fetchOverview({
    required String clubId,
    required String memberId,
  }) async =>
      throw Exception('네트워크 오류');

  @override
  Future<List<MemberDirectoryItem>> fetchMemberDirectory({
    required String clubId,
    required String memberId,
  }) async =>
      throw Exception('네트워크 오류');
}
```

- [ ] **Step 2: 테스트 실행 — 두 번째 테스트가 실패해야 함**

```powershell
cd D:\workspace\Crewith\apps\mobile-app
flutter test test/widget_test.dart
```

Expected: `shows error state when API throws` FAIL (에러 UI가 아직 없으므로)

---

## Task 3: `member_api_client.dart` — 타임아웃 연장

**Files:**
- Modify: `apps/mobile-app/lib/member_api_client.dart`

- [ ] **Step 1: `_client()` 메서드 connectionTimeout 변경 (286행)**

```dart
// 변경 전
HttpClient _client() {
  return HttpClient()..connectionTimeout = const Duration(seconds: 2);
}

// 변경 후
HttpClient _client() {
  return HttpClient()..connectionTimeout = const Duration(seconds: 10);
}
```

- [ ] **Step 2: 모든 `.timeout(const Duration(seconds: 3))` → 15s로 변경**

파일 내 `.timeout(const Duration(seconds: 3))` 4곳을 모두 교체:

```dart
// 변경 전
await request.close().timeout(const Duration(seconds: 3));

// 변경 후
await request.close().timeout(const Duration(seconds: 15));
```

`fetchOverview`(28행), `verifyOtp`(61행), `fetchNotifications`(118행), `fetchMemberDirectory`(148행), `_sendJson`(306행) — 총 5곳.

---

## Task 4: `fetchOverview` / `fetchMemberDirectory` — 실패 시 예외 throw

**Files:**
- Modify: `apps/mobile-app/lib/member_api_client.dart`

- [ ] **Step 1: `fetchOverview` 메서드 교체 (18-42행)**

```dart
Future<MemberAppOverview> fetchOverview({
  required String clubId,
  required String memberId,
}) async {
  final uri = Uri.parse('$apiBaseUrl/clubs/$clubId/member-app/$memberId');
  final client = _client();

  try {
    final request = await client.getUrl(uri);
    final response =
        await request.close().timeout(const Duration(seconds: 15));

    if (response.statusCode != HttpStatus.ok) {
      throw Exception('HTTP ${response.statusCode}');
    }

    final payload = await response.transform(utf8.decoder).join();
    final json = jsonDecode(payload) as Map<String, dynamic>;
    return MemberAppOverview.fromJson(json['data'] as Map<String, dynamic>);
  } finally {
    client.close(force: true);
  }
}
```

- [ ] **Step 2: `fetchMemberDirectory` 메서드 교체 (137-165행)**

```dart
Future<List<MemberDirectoryItem>> fetchMemberDirectory({
  required String clubId,
  required String memberId,
}) async {
  final uri =
      Uri.parse('$apiBaseUrl/clubs/$clubId/member-app/$memberId/members');
  final client = _client();

  try {
    final request = await client.getUrl(uri);
    final response =
        await request.close().timeout(const Duration(seconds: 15));

    if (response.statusCode != HttpStatus.ok) {
      throw Exception('HTTP ${response.statusCode}');
    }

    final payload = await response.transform(utf8.decoder).join();
    final json = jsonDecode(payload) as Map<String, dynamic>;
    return (json['data'] as List<dynamic>)
        .map((item) =>
            MemberDirectoryItem.fromJson(item as Map<String, dynamic>))
        .toList();
  } finally {
    client.close(force: true);
  }
}
```

---

## Task 5: `main.dart` — FutureBuilder 에러 UI 추가

**Files:**
- Modify: `apps/mobile-app/lib/main.dart`

- [ ] **Step 1: `overview` FutureBuilder에 hasError 케이스 추가 (397-491행)**

`FutureBuilder<MemberAppOverview>` builder 함수 맨 앞에 에러 케이스 추가:

```dart
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

    final overview = snapshot.data ?? MemberAppOverview.seed();
    // ... 이하 기존 코드 유지
```

- [ ] **Step 2: `memberDirectory` FutureBuilder에 hasError 케이스 추가 (423-431행)**

```dart
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
```

- [ ] **Step 3: 테스트 실행 — 두 번째 테스트 통과 확인**

```powershell
flutter test test/widget_test.dart
```

Expected: 두 테스트 모두 PASS

---

## Task 6: `main.dart` — 쓰기 실패 메시지 교체

**Files:**
- Modify: `apps/mobile-app/lib/main.dart`

- [ ] **Step 1: `_updateEventResponse` 실패 메시지 교체 (209행)**

```dart
// 변경 전
return '오프라인 미리보기로 반영했습니다.';

// 변경 후
return '연결 실패. 다시 시도하세요.';
```

- [ ] **Step 2: `_markNoticeRead` 실패 메시지 교체 (226행)**

```dart
// 변경 전
return '오프라인 미리보기로 확인 처리했습니다.';

// 변경 후
return '연결 실패. 다시 시도하세요.';
```

- [ ] **Step 3: `_toggleNoticeReaction` 실패 메시지 교체 (243행)**

```dart
// 변경 전
return '오프라인 미리보기로 좋아요를 반영했습니다.';

// 변경 후
return '연결 실패. 다시 시도하세요.';
```

- [ ] **Step 4: `_createNoticeComment` 실패 메시지 교체 (271행)**

```dart
// 변경 전
return '오프라인 미리보기로 댓글을 반영했습니다.';

// 변경 후
return '연결 실패. 다시 시도하세요.';
```

- [ ] **Step 5: `_markNotificationRead` 실패 메시지 교체 (297행)**

```dart
// 변경 전
return '오프라인 미리보기로 읽음 처리했습니다.';

// 변경 후
return '연결 실패. 다시 시도하세요.';
```

- [ ] **Step 6: `_updateProfile` 실패 메시지 교체 (191행)**

```dart
// 변경 전
return saved ? '프로필을 저장했습니다.' : '로컬 미리보기 프로필을 저장했습니다.';

// 변경 후
return saved ? '프로필을 저장했습니다.' : '저장에 실패했습니다. 다시 시도하세요.';
```

---

## Task 7: 최종 검증 및 커밋

**Files:** 없음 (검증 + 커밋)

- [ ] **Step 1: 전체 테스트 통과 확인**

```powershell
cd D:\workspace\Crewith\apps\mobile-app
flutter test
```

Expected: All tests pass.

- [ ] **Step 2: 정적 분석 확인**

```powershell
flutter analyze
```

Expected: No issues found.

- [ ] **Step 3: 커밋**

```powershell
cd D:\workspace\Crewith
git add apps/mobile-app/lib/member_api_client.dart
git add apps/mobile-app/lib/main.dart
git add apps/mobile-app/test/widget_test.dart
git commit -m "Remove offline fallback, connect to Railway API for real"
```

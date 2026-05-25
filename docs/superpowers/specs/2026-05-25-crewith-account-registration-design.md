# Crewith 계정 자체 가입 설계

## 개요

누구나 전화번호·이름·비밀번호·생년월일로 Crewith 계정을 직접 생성할 수 있다. 계정 생성과 모임 합류는 독립된 행위이며, 모임 합류는 관리자 초대로만 가능하다 (1차 MVP).

## 아키텍처

기존 `members[]` 배열을 Crewith 전역 계정 저장소로 확장한다. 클럽 소속 여부는 `clubMemberships[]`로 별도 관리되므로 데이터 구조 변경은 최소화된다.

**기술 스택**: NestJS API (TypeScript), Flutter 모바일 앱 (Dart)

---

## 1. 데이터 모델

### `AdminMemberListItem` 필드 추가

```typescript
export interface AdminMemberListItem {
  // 기존 필드...
  birthDate?: string;  // "YYYY-MM-DD", 선택 입력
}
```

`MvpStore` 배열 구조는 변경 없음. 새로 가입한 계정은 `members[]`에 추가되고 `clubMemberships[]` 항목 없이 존재한다.

---

## 2. API

### 추가: `POST /auth/register`

**Input**
```typescript
export interface RegisterInput {
  name: string;
  phoneNumber: string;
  password: string;
  birthDate?: string;
}
```

**동작**
1. `normalizePhoneNumber(phoneNumber)`로 정규화
2. 동일 전화번호가 `members[]`에 있으면 → 409 `"이미 사용 중인 전화번호입니다."`
3. 없으면 → `members[]`에 추가 (clubMembership 없음), 비밀번호 평문 저장
4. 201 반환: `{ data: { memberId: string } }`

**권한**: 없음 (누구나 호출 가능)

---

### 수정: `acceptInvite` 내부 로직

```typescript
// 기존: 항상 createMemberFromProfile 호출
// 변경: 전화번호로 기존 계정 조회 후 분기

const existing = members.find(
  m => normalizePhoneNumber(m.phoneNumber) === normalizedPhone && m.memberStatus !== "removed"
);

if (existing) {
  // clubMembership만 추가
  clubMemberships.push({ clubId, memberId: existing.id, role: "member", ... });
  persistStore();
  return existing;
} else {
  // 기존대로 멤버 생성 + clubMembership 추가
  return createMemberFromProfile(name, normalizedPhone);
}
```

초대 수락 시 기존 계정의 이름·비밀번호는 변경하지 않는다.

---

## 3. 모바일 앱

### `lib/member_api_client.dart`

```dart
Future<String?> register({
  required String name,
  required String phoneNumber,
  required String password,
  String? birthDate,
}) async {
  // POST /auth/register
  // 성공 → memberId 반환
  // 409 → null 반환 (중복 전화번호)
}
```

### `lib/screens/auth_page.dart` 수정

로그인 폼 하단에 회원가입 링크 추가:
```
아직 계정이 없으신가요? [회원가입]
```
탭 시 `RegisterPage`로 이동.

### `lib/screens/register_page.dart` 신규

```
제목: 회원가입
필드:
  - 이름 (필수)
  - 전화번호 (필수)
  - 비밀번호 (필수, obscureText: true)
  - 생년월일 (선택, placeholder: "YYYY-MM-DD")
버튼: 가입하기
성공: 로그인 화면으로 이동 + SnackBar "가입 완료. 로그인해주세요."
실패(409): 에러 메시지 "이미 사용 중인 전화번호입니다."
실패(기타): 에러 메시지 "가입에 실패했습니다. 다시 시도하세요."
```

### `lib/main.dart` 수정

로그인 후 `session.clubs`가 비어있으면 빈 모임 화면 표시:
```dart
if (session.clubs.isEmpty) {
  // _defaultClubs 폴백 제거
  // "아직 참여 중인 모임이 없습니다" 화면으로 분기
}
```

### `lib/screens/no_club_page.dart` 신규

```
내용: "아직 참여 중인 모임이 없습니다.\n관리자의 초대를 기다려주세요."
버튼: 로그아웃
```

---

## 4. 에러 처리 / 엣지케이스

| 상황 | 처리 |
|---|---|
| 중복 전화번호로 가입 시도 | API 409 → 앱 "이미 사용 중인 전화번호입니다." |
| 클럽 없는 상태로 로그인 | `NoClubPage` 표시, 로그아웃 가능 |
| 초대 수락 — 이미 가입된 전화번호 | 기존 계정에 clubMembership만 추가 |
| 초대 수락 — 이미 해당 클럽 멤버 | 기존 동작 유지 (중복 처리) |
| 비밀번호 분실 | MVP 범위 밖 — 관리자가 PATCH .../password로 재설정 |

---

## 변경 없는 파일

- `apps/admin-web/` — 전체 변경 없음
- `lib/member_models.dart` — `AuthSession` 구조 동일
- 기존 로그인·비밀번호 재설정 흐름 전부

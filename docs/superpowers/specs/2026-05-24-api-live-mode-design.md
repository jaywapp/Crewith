# API 실제 연동 설계

**날짜**: 2026-05-24  
**범위**: `apps/mobile-app` Flutter 앱  
**목표**: 오프라인 미리보기 폴백 제거, Railway API와 실제 연동

## 배경

Railway 프로덕션 API(`https://crewith-api-production.up.railway.app/api/v1`)는 읽기/쓰기 모두 정상 동작 중. 문제는 앱 측 타임아웃이 짧고(연결 2s, 응답 3s), 실패 시 시드 데이터로 무음 대체해 실패를 숨기는 구조.

## 변경 범위

### 1. 타임아웃 연장 (`member_api_client.dart`)

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| `connectionTimeout` | 2s | 10s |
| 응답 timeout | 3s | 15s |

Railway 콜드스타트(최대 5~8초)를 수용하기 위함.

### 2. 읽기 실패 처리

**`member_api_client.dart`**
- `fetchOverview`: 실패 시 `MemberAppOverview.seed()` 반환 → 예외 throw
- `fetchMemberDirectory`: 실패 시 `seedItems` 반환 → 예외 throw
- `fetchNotifications`: 빈 리스트 유지 (알림 없음과 동일 취급, 치명적이지 않음)

**`main.dart` FutureBuilder**
- `snapshot.hasError` 케이스 추가
- 에러 UI: "연결에 실패했습니다" + "다시 시도" 버튼
- "다시 시도" → `_refreshOverview()` 또는 `_refreshNotifications()` 호출

### 3. 쓰기 실패 메시지 교체 (`main.dart`)

낙관적 UI 업데이트(즉각 반영)는 유지. API 실패 시 메시지만 교체.

| 메서드 | 현재 실패 메시지 | 변경 후 |
|--------|----------------|---------|
| `_updateEventResponse` | "오프라인 미리보기로 반영했습니다" | "연결 실패. 다시 시도하세요." |
| `_markNoticeRead` | "오프라인 미리보기로 확인 처리했습니다" | "연결 실패. 다시 시도하세요." |
| `_toggleNoticeReaction` | "오프라인 미리보기로 좋아요를 반영했습니다" | "연결 실패. 다시 시도하세요." |
| `_createNoticeComment` | "오프라인 미리보기로 댓글을 반영했습니다" | "연결 실패. 다시 시도하세요." |
| `_markNotificationRead` | "오프라인 미리보기로 읽음 처리했습니다" | "연결 실패. 다시 시도하세요." |
| `_updateProfile` | "로컬 미리보기 프로필을 저장했습니다" | "저장에 실패했습니다. 다시 시도하세요." |

## 수정 파일

- `apps/mobile-app/lib/member_api_client.dart`
- `apps/mobile-app/lib/main.dart`

## 수정하지 않는 것

- Railway 백엔드 코드 — 이미 정상 동작
- OTP 로직 — 별도 범위
- 알림(`fetchNotifications`) 실패 처리 — 빈 리스트 유지

# Crewith API 명세 초안

## 1. 설계 기준

- API 스타일은 REST를 기준으로 한다.
- 백엔드는 NestJS API 서버를 우선 고려한다.
- 인증은 Bearer JWT를 기준으로 한다.
- 모든 모임 리소스는 `clubId` 기준으로 권한을 검사한다.
- 기본 역할은 `owner`, `operator`, `member`다.
- 운영진 전용 공지/일정은 일반 회원에게 목록과 상세 모두 노출하지 않는다.

## 2. 공통 규칙

### Base URL

```text
/api/v1
```

### 인증 헤더

```http
Authorization: Bearer <accessToken>
```

### 공통 응답

```json
{
  "data": {},
  "meta": {}
}
```

### 공통 오류

| 코드 | 의미 |
|---|---|
| 400 | 요청 형식 오류 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복 또는 상태 충돌 |
| 422 | 검증 실패 |

## 2-1. clubId 기반 다중 모임 계약

모든 모임 리소스는 `clubId` 기준으로 접근한다. 아래 규칙은 모든 Club 스코프 API에 적용된다.

| 규칙 | 상세 |
|---|---|
| 존재하지 않는 `clubId` | HTTP 404 반환 |
| 해당 모임에 가입되지 않은 사용자 | HTTP 403 반환 |
| 일반 회원은 가입된 모임 데이터만 접근 가능 | 멤버십 검증 미들웨어 필수 |
| 운영진은 본인이 운영진인 모임만 관리 가능 | 역할 가드 필수 |
| 한 사용자는 여러 모임에 서로 다른 역할로 가입 가능 | 역할은 모임별로 독립 |
| `memberStatus`가 `removed`인 회원은 접근 불가 | 멤버십 검증에서 상태 체크 |

### 오류 코드 표준

| 상황 | HTTP 상태 | 오류 코드 (권고) |
|---|---|---|
| 존재하지 않는 clubId | 404 | `CLUB_NOT_FOUND` |
| 모임 멤버십 없음 | 403 | `NOT_CLUB_MEMBER` |
| 역할 권한 부족 | 403 | `INSUFFICIENT_ROLE` |
| 리소스 없음 | 404 | `RESOURCE_NOT_FOUND` |
| 상태 충돌 (중복 신청 등) | 409 | `CONFLICT` |
| 응답 마감 초과 | 422 | `RESPONSE_DEADLINE_PASSED` |

> 계약상 필요하지만 구현 확인 필요: 오류 응답 포맷 통일 및 오류 코드 열거형 정의

---

## 3. 인증 API

> **MVP 구현 주의**: MVP 구현에서는 Bearer JWT 대신 `x-crewith-role` 헤더로 역할을 전달한다. Firebase Auth 연동 후 Bearer JWT로 전환 예정.

### OTP 인증 요청

```http
POST /auth/otp/request
```

> MVP 실제 경로: `/auth/otp/request` (API_SPEC 초안 `/auth/sms/request`에서 변경됨)

Request:

```json
{
  "phoneNumber": "01012345678"
}
```

Response:

```json
{
  "data": {
    "verificationId": "uuid",
    "expiresInSeconds": 180
  }
}
```

### OTP 인증 확인 및 로그인

```http
POST /auth/otp/verify
```

> MVP 실제 경로: `/auth/otp/verify` (API_SPEC 초안 `/auth/sms/verify`에서 변경됨)

Request:

```json
{
  "verificationId": "uuid",
  "code": "123456"
}
```

Response:

```json
{
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "user": {
      "id": "uuid",
      "phoneNumber": "01012345678",
      "name": "홍길동"
    }
  }
}
```

### 토큰 갱신

```http
POST /auth/refresh
```

### 로그아웃

```http
POST /auth/logout
```

## 4. 사용자 API

### 내 프로필 조회

```http
GET /members/{memberId}/profile
```

> MVP 실제 경로: `/members/{memberId}/profile` (초안 `/me`에서 변경됨)

권한: 로그인 사용자

### 내 프로필 수정

```http
PATCH /members/{memberId}/profile
```

> MVP 실제 경로: `/members/{memberId}/profile` (초안 `/me`에서 변경됨)

Request:

```json
{
  "name": "홍길동",
  "birthDate": "1990-01-01",
  "gender": "male",
  "profileImageFileId": "uuid"
}
```

### 내 가입 모임 목록

```http
GET /me/clubs
```

Response:

```json
{
  "data": [
    {
      "clubId": "uuid",
      "name": "토요 풋살",
      "sportType": "futsal",
      "role": "operator",
      "memberStatus": "active"
    }
  ]
}
```

### 디바이스 등록

```http
POST /me/devices
```

Request:

```json
{
  "platform": "android",
  "fcmToken": "token"
}
```

## 5. 모임 API

### 모임 생성

```http
POST /clubs
```

권한: 로그인 사용자

Request:

```json
{
  "name": "토요 풋살",
  "sportType": "futsal",
  "visibility": "private"
}
```

생성자는 자동으로 `owner`가 된다. 무료 체험은 생성 시점부터 30일로 설정한다.

### 모임 상세 조회

```http
GET /clubs/{clubId}
```

권한: 해당 모임 멤버

### 모임 설정 수정

```http
PATCH /clubs/{clubId}
```

권한: owner

### 모임 구독 상태 조회

```http
GET /clubs/{clubId}/subscription
```

권한: owner, operator

## 6. 가입과 초대 API

### 공개 모임 가입 신청

```http
POST /clubs/{clubId}/join-requests
```

권한: 로그인 사용자

Request:

```json
{
  "applicantName": "홍길동",
  "applicantPhone": "01012345678",
  "greeting": "안녕하세요. 같이 운동하고 싶습니다."
}
```

### 가입 신청 목록 조회

```http
GET /clubs/{clubId}/join-requests?status=pending
```

권한: owner, operator

### 가입 신청 승인

```http
POST /clubs/{clubId}/join-requests/{requestId}/approve
```

권한: owner, operator

승인 시 `club_members`가 생성되고 신청자에게 푸시 알림을 보낸다.

### 가입 신청 거절

```http
POST /clubs/{clubId}/join-requests/{requestId}/reject
```

권한: owner, operator

### 초대 링크 생성

```http
POST /clubs/{clubId}/invite-links
```

권한: owner, operator

Request:

```json
{
  "expiresAt": "2026-06-01T00:00:00+09:00"
}
```

### 초대 링크로 가입

```http
POST /invite-links/{token}/join
```

권한: 로그인 사용자

## 7. 구성원 API

### 구성원 목록 조회

```http
GET /clubs/{clubId}/members
```

권한: 해당 모임 멤버

일반 회원에게는 모임 개인정보 공개 설정에 따라 필드를 제한한다.

### 구성원 상세 조회

```http
GET /clubs/{clubId}/members/{memberId}
```

권한: 해당 모임 멤버

### 구성원 수정

```http
PATCH /clubs/{clubId}/members/{memberId}
```

권한: owner, operator 또는 본인 제한 수정

### 구성원 상태 변경

```http
PATCH /clubs/{clubId}/members/{memberId}/status
```

권한: owner, operator

Request:

```json
{
  "memberStatus": "dormant"
}
```

`left`, `removed`, `dormant` 상태는 개인정보 삭제 예정일을 30일 후로 설정한다.

### 구성원 역할 변경

```http
PATCH /clubs/{clubId}/members/{memberId}/role
```

권한: owner

Request:

```json
{
  "role": "operator"
}
```

### Excel 구성원 업로드

```http
POST /clubs/{clubId}/members/imports
Content-Type: multipart/form-data
```

권한: owner, operator

동작:

- 업로드 즉시 등록한다.
- 필수값 누락, 연락처 중복, 형식 오류를 검증한다.
- 성공/실패 건수를 반환한다.

Response:

```json
{
  "data": {
    "createdCount": 20,
    "failedCount": 2,
    "errors": [
      {
        "row": 5,
        "reason": "phone_number_duplicated"
      }
    ]
  }
}
```

### 개인정보 공개 설정 조회/수정

```http
GET /clubs/{clubId}/privacy-settings
PUT /clubs/{clubId}/privacy-settings
```

권한: owner, operator

## 8. 회비 API

### 회비 설정 조회

```http
GET /clubs/{clubId}/fee-settings
```

권한: owner, operator

### 회비 설정 수정

```http
PUT /clubs/{clubId}/fee-settings
```

권한: owner, operator

Request:

```json
{
  "amount": 30000,
  "dueDay": 10,
  "intervalType": "monthly",
  "customIntervalDays": null,
  "gracePeriodDays": 3,
  "autoReminderEnabled": true,
  "reminderRule": {
    "daysAfterDueDate": [1, 3, 7]
  }
}
```

### 회비 항목 목록 조회

```http
GET /clubs/{clubId}/fee-items?from=2026-05-01&to=2026-05-31
```

권한: 해당 모임 멤버

운영진은 전체 항목을 보고, 일반 회원은 본인에게 부과된 항목만 본다.

### 일회성 비용 생성

```http
POST /clubs/{clubId}/fee-items
```

권한: owner, operator

Request:

```json
{
  "title": "유니폼비",
  "feeType": "one_time",
  "amount": 50000,
  "dueDate": "2026-06-10",
  "targetMemberIds": ["uuid", "uuid"]
}
```

### 납부 상태 목록 조회

```http
GET /clubs/{clubId}/fee-items/{feeItemId}/payments
```

권한: owner, operator

### 내 납부 내역 조회

```http
GET /clubs/{clubId}/my/fee-payments
```

권한: 해당 모임 멤버

### 납부 상태 토글

```http
PATCH /clubs/{clubId}/fee-payments/{paymentId}
```

권한: owner, operator

Request:

```json
{
  "status": "paid",
  "paidAt": "2026-05-20T12:00:00+09:00"
}
```

`paidAt`이 없으면 서버가 현재 시간을 기록한다.

### 미납자 목록 조회

```http
GET /clubs/{clubId}/fee-payments/overdue
```

권한: owner, operator

## 9. 일정 API

### 일정 목록 조회

```http
GET /clubs/{clubId}/events?from=2026-05-01&to=2026-05-31
```

권한: 해당 모임 멤버

일반 회원은 `all_members` 일정만 조회한다.

### 일정 생성

```http
POST /clubs/{clubId}/events
```

권한: owner, operator

Request:

```json
{
  "title": "토요 풋살",
  "description": "정기 경기",
  "startsAt": "2026-05-23T10:00:00+09:00",
  "endsAt": "2026-05-23T12:00:00+09:00",
  "visibility": "all_members",
  "responseDeadline": "2026-05-22T18:00:00+09:00",
  "location": {
    "name": "OO 풋살장",
    "address": "서울시 ...",
    "naverMapPlaceId": "place-id",
    "latitude": 37.0,
    "longitude": 127.0
  }
}
```

### 일정 상세 조회

```http
GET /clubs/{clubId}/events/{eventId}
```

권한: 해당 모임 멤버. 운영진 전용 일정은 owner/operator만 접근.

### 일정 수정/삭제

```http
PATCH /clubs/{clubId}/events/{eventId}
DELETE /clubs/{clubId}/events/{eventId}
```

권한: owner, operator

### 참석 의사 응답

```http
PUT /clubs/{clubId}/events/{eventId}/response
```

권한: 해당 모임 멤버

Request:

```json
{
  "response": "attending"
}
```

응답 마감 시간이 지나면 수정할 수 없다.

### 참석 의사 현황 조회

```http
GET /clubs/{clubId}/events/{eventId}/responses
```

권한: owner, operator

### 출석부 조회

```http
GET /clubs/{clubId}/events/{eventId}/attendance
```

권한: owner, operator

### 출석부 저장

```http
PUT /clubs/{clubId}/events/{eventId}/attendance
```

권한: owner, operator

Request:

```json
{
  "items": [
    {
      "memberId": "uuid",
      "status": "present",
      "companionCount": 1
    }
  ]
}
```

## 10. 공지 API

### 공지 목록 조회

```http
GET /clubs/{clubId}/notices
```

권한: 해당 모임 멤버

일반 회원은 `all_members` 공지만 조회한다.

### 공지 생성

```http
POST /clubs/{clubId}/notices
```

권한: owner, operator

Request:

```json
{
  "title": "이번 주 경기 안내",
  "body": "토요일 오전 10시입니다.",
  "visibility": "all_members"
}
```

### 공지 상세 조회

```http
GET /clubs/{clubId}/notices/{noticeId}
```

권한: 해당 모임 멤버. 운영진 전용 공지는 owner/operator만 접근.

조회 시 자동으로 확인 처리한다.

### 공지 수정/삭제

```http
PATCH /clubs/{clubId}/notices/{noticeId}
DELETE /clubs/{clubId}/notices/{noticeId}
```

권한: owner, operator

### 공지 확인 현황 조회

```http
GET /clubs/{clubId}/notices/{noticeId}/reads
```

권한: owner, operator

### 댓글 목록 조회

```http
GET /clubs/{clubId}/notices/{noticeId}/comments
```

권한: 공지 보기 권한이 있는 멤버

### 댓글 작성

```http
POST /clubs/{clubId}/notices/{noticeId}/comments
```

권한: 공지 보기 권한이 있는 멤버

### 댓글 수정/삭제

```http
PATCH /clubs/{clubId}/notices/{noticeId}/comments/{commentId}
DELETE /clubs/{clubId}/notices/{noticeId}/comments/{commentId}
```

권한: 댓글 작성자 또는 owner/operator

### 좋아요 토글

```http
PUT /clubs/{clubId}/notices/{noticeId}/reaction
DELETE /clubs/{clubId}/notices/{noticeId}/reaction
```

권한: 공지 보기 권한이 있는 멤버

## 11. 알림 API

### 알림 목록 조회

```http
GET /me/notifications
```

권한: 로그인 사용자

### 알림 읽음 처리

```http
PATCH /me/notifications/{notificationId}/read
```

권한: 로그인 사용자

### 모임 알림 설정 조회/수정

```http
GET /clubs/{clubId}/notification-settings
PUT /clubs/{clubId}/notification-settings
```

권한: owner, operator

Request:

```json
{
  "eventReminderRule": {
    "beforeStartMinutes": [1440, 180]
  },
  "feeReminderRule": {
    "daysAfterDueDate": [1, 3, 7]
  },
  "noticeUnreadReminderRule": {
    "hoursAfterPublished": [24, 48]
  }
}
```

## 12. 파일 API

### 업로드 URL 발급

```http
POST /files/presigned-upload
```

권한: 로그인 사용자

Request:

```json
{
  "fileType": "profile_image",
  "mimeType": "image/jpeg",
  "sizeBytes": 102400
}
```

Response:

```json
{
  "data": {
    "fileId": "uuid",
    "uploadUrl": "https://...",
    "publicUrl": "https://..."
  }
}
```

### 프로필 사진 연결

```http
PATCH /me/profile-image
```

권한: 로그인 사용자

Request:

```json
{
  "fileId": "uuid"
}
```

## 13. 통계 API

### 대시보드 요약

```http
GET /clubs/{clubId}/dashboard/summary
```

권한: owner, operator

Response:

```json
{
  "data": {
    "totalMemberCount": 28,
    "activeMemberCount": 25,
    "overdueMemberCount": 3,
    "noticeReadRate": 0.82,
    "attendanceRate": 0.74,
    "attendanceConversionRate": 0.91,
    "monthlyFeeCollectionRate": 0.88
  }
}
```

### 회비 통계

```http
GET /clubs/{clubId}/stats/fees?month=2026-05
```

권한: owner, operator

### 일정 통계

```http
GET /clubs/{clubId}/stats/events?from=2026-05-01&to=2026-05-31
```

권한: owner, operator

### 공지 통계

```http
GET /clubs/{clubId}/stats/notices?from=2026-05-01&to=2026-05-31
```

권한: owner, operator

## 14. 외부 연동 API

### 네이버 지도 장소 검색 프록시

```http
GET /integrations/naver-map/places?query=풋살장
```

권한: 로그인 사용자

서버에서 네이버 지도 API 키를 보호하기 위해 프록시 형태로 제공한다.

## 15. 백그라운드 작업

API 엔드포인트는 아니지만 백엔드 작업으로 필요하다.

| 작업 | 설명 |
|---|---|
| 정기 회비 항목 생성 | 납부일/간격 기준으로 `fee_items`, `fee_payments` 생성 |
| 미납 상태 계산 | 납부일 + 유예기간 기준 미납 상태 반영 |
| 미납 알림 발송 | 모임별 알림 설정 기준 FCM 발송 |
| 일정 알림 발송 | 모임별 일정 알림 설정 기준 FCM 발송 |
| 공지 미확인 리마인드 | 공지 확인 기록 기준 FCM 발송 |
| 개인정보 삭제 | 탈퇴/강퇴/휴면 후 30일 경과 데이터 삭제 |

## 15-1. 리마인더 API

### 리마인더 대상 목록 조회

```http
GET /clubs/{clubId}/reminders/targets?type=fee
GET /clubs/{clubId}/reminders/targets?type=notice&noticeId=uuid
GET /clubs/{clubId}/reminders/targets?type=event&eventId=uuid
```

권한: owner, operator

파라미터:
- `type`: `fee` | `notice` | `event`
- `feeItemId`, `noticeId`, `eventId`: 해당 type에 따라 필요

Response (fee 예시):
```json
{
  "data": {
    "type": "fee",
    "targets": [
      {
        "memberId": "uuid",
        "name": "홍길동",
        "feeItemTitle": "5월 회비",
        "daysOverdue": 5
      }
    ]
  }
}
```

### 리마인더 발송

```http
POST /clubs/{clubId}/reminders/send
```

권한: owner, operator

Request:
```json
{
  "type": "fee",
  "targetMemberIds": ["uuid", "uuid"],
  "feeItemId": "uuid"
}
```

Response:
```json
{
  "data": {
    "sentCount": 2,
    "failedCount": 0,
    "logId": "uuid"
  }
}
```

> 계약상 필요하지만 구현 확인 필요: FCM 미연동 시 로그만 기록하고 실제 발송 없음

---

## 16. 권한 요약

| 역할 | 가능 작업 |
|---|---|
| owner | 모임 설정, 역할 변경, 모든 운영 기능 |
| operator | 구성원, 회비, 일정, 공지, 출석, 통계 관리 |
| member | 본인 정보, 본인 회비, 일정 응답, 공지 조회/댓글/좋아요 |

## 17. 화면별 API 매핑

> MVP 실제 구현 코드 기준으로 작성한다. "추후 구현" 표시 항목은 MVP 코드에 없는 엔드포인트다.

### 관리자 웹

| 화면 | MVP 구현 API | 비고 |
|---|---|---|
| 대시보드 | `GET /clubs/{clubId}/admin/overview` | 초안 `/dashboard/summary`에서 변경 |
| 회원 목록 | `GET /clubs/{clubId}/members` | |
| 회원 등록 | `POST /clubs/{clubId}/members` | |
| 회원 수정 (상태/역할 포함) | `PATCH /clubs/{clubId}/members/{memberId}` | 상태·역할 단일 PATCH로 처리 |
| 회원 삭제 | `DELETE /clubs/{clubId}/members/{memberId}` | |
| 회원 회비상태 변경 | `PATCH /clubs/{clubId}/members/{memberId}/fee-status` | |
| Excel 업로드 | `POST /clubs/{clubId}/members/imports` | |
| 개인정보 공개 설정 | `GET /clubs/{clubId}/privacy-settings`, `PUT /clubs/{clubId}/privacy-settings` | |
| 회비 현황 | `GET /clubs/{clubId}/fees` | 초안 `/fee-items`에서 변경 |
| 회비 생성 | `POST /clubs/{clubId}/fees` | 초안 `/fee-items`에서 변경 |
| 월회비 설정 | `GET /clubs/{clubId}/fee-settings`, `PUT /clubs/{clubId}/fee-settings` | |
| 납부 상태 토글 | `PATCH /clubs/{clubId}/fees/{feeId}/payments` | 초안 `/fee-payments/{id}`에서 변경 |
| 미납자 목록 | — | 추후 구현 (`/fee-payments/overdue`); 현재 `/fees` 응답에서 클라이언트 필터링 |
| 일정 목록 | `GET /clubs/{clubId}/events` | |
| 일정 생성 | `POST /clubs/{clubId}/events` | |
| 일정 수정 | `PATCH /clubs/{clubId}/events/{eventId}` | |
| 일정 삭제 | `DELETE /clubs/{clubId}/events/{eventId}` | |
| 참석 의사 현황 | `PATCH /clubs/{clubId}/events/{eventId}/responses` | GET은 추후 구현 |
| 출석부 저장 | `PATCH /clubs/{clubId}/events/{eventId}/attendance` | GET은 추후 구현; 초안 PUT에서 변경 |
| 공지 목록 | `GET /clubs/{clubId}/notices` | |
| 공지 작성 | `POST /clubs/{clubId}/notices` | |
| 공지 수정 | `PATCH /clubs/{clubId}/notices/{noticeId}` | |
| 공지 삭제 | `DELETE /clubs/{clubId}/notices/{noticeId}` | |
| 공지 확인 처리 | `PATCH /clubs/{clubId}/notices/{noticeId}/read` | |
| 공지 좋아요 | `PATCH /clubs/{clubId}/notices/{noticeId}/reactions` | |
| 공지 댓글 | `POST /clubs/{clubId}/notices/{noticeId}/comments` | |
| 가입 신청 목록 | `GET /clubs/{clubId}/join-requests` | |
| 가입 신청 승인/거절 | `PATCH /clubs/{clubId}/join-requests/{requestId}` | 초안 approve/reject 별도 POST에서 변경 |
| 초대 링크 목록 | `GET /clubs/{clubId}/invite-links` | |
| 초대 링크 생성 | `POST /clubs/{clubId}/invite-links` | |
| 초대 링크 비활성화 | `PATCH /clubs/{clubId}/invite-links/{inviteId}/disable` | 초안 `/deactivate`에서 변경 |
| 리마인더 발송 | `GET /clubs/{clubId}/reminders`, `POST /clubs/{clubId}/reminders/send` | 초안 `/reminders/targets`에서 변경 |
| 알림 설정 | `GET /clubs/{clubId}/notification-settings`, `PUT /clubs/{clubId}/notification-settings` | |

### 회원 앱

| 화면 | MVP 구현 API | 비고 |
|---|---|---|
| 로그인 | `POST /auth/otp/request`, `POST /auth/otp/verify` | 초안 `/auth/sms/`에서 변경 |
| 프로필 입력/수정 | `GET /members/{memberId}/profile`, `PATCH /members/{memberId}/profile` | 초안 `/me`에서 변경 |
| 모임 목록 | — | 추후 구현 (`GET /me/clubs`); 현재 로그인 응답에 포함 |
| 홈 (회원 앱) | `GET /clubs/{clubId}/member-app/{memberId}` | 초안 `/dashboard/member-summary`에서 변경 |
| 일정 목록 | `GET /clubs/{clubId}/events` | |
| 참석 의사 응답 | `PATCH /clubs/{clubId}/events/{eventId}/responses` | 초안 PUT에서 변경 |
| 공지 목록 | `GET /clubs/{clubId}/notices` | |
| 공지 확인 처리 | `PATCH /clubs/{clubId}/notices/{noticeId}/read` | |
| 댓글/좋아요 | `POST /clubs/{clubId}/notices/{noticeId}/comments`, `PATCH .../reactions` | |
| 내 회비 | — | 추후 구현 (`GET /clubs/{clubId}/my/fee-payments`); 현재 member-app overview에 포함 |
| 구성원 목록 | `GET /clubs/{clubId}/member-app/{memberId}/members` | 공개 설정 반영 필드 제한 |
| 알림 목록 | `GET /me/notifications` | |
| 알림 읽음 처리 | `PATCH /me/notifications/{notificationId}/read` | |
| 디바이스 등록 | `POST /me/devices` | |
| 공개 모임 가입 신청 | `POST /clubs/{clubId}/join-requests` | |
| 초대 링크 가입 | `POST /clubs/{clubId}/invite-links/{token}/accept` | 초안 `/invite-links/{token}/join`에서 변경 |
| 프로필 사진 | — | 추후 구현 (Storage 연동 필요) |

---

### 계약 vs MVP 구현 불일치 요약

| 항목 | API_SPEC 초안 경로 | MVP 실제 경로 |
|---|---|---|
| OTP 인증 | `/auth/sms/request`, `/auth/sms/verify` | `/auth/otp/request`, `/auth/otp/verify` |
| 프로필 | `/me` | `/members/{memberId}/profile` |
| 관리자 대시보드 | `/clubs/{id}/dashboard/summary` | `/clubs/{id}/admin/overview` |
| 회원 앱 홈 | `/clubs/{id}/dashboard/member-summary` | `/clubs/{id}/member-app/{memberId}` |
| 회비 목록 | `/clubs/{id}/fee-items` | `/clubs/{id}/fees` |
| 납부 토글 | `/clubs/{id}/fee-payments/{id}` | `/clubs/{id}/fees/{feeId}/payments` |
| 가입 승인/거절 | `POST .../approve`, `POST .../reject` | `PATCH .../join-requests/{id}` |
| 초대 비활성화 | `PATCH .../deactivate` | `PATCH .../disable` |
| 초대 수락 | `POST /invite-links/{token}/join` | `POST /clubs/{id}/invite-links/{token}/accept` |
| 출석부 저장 | `PUT .../attendance` | `PATCH .../attendance` |
| 리마인더 대상 조회 | `GET .../reminders/targets` | `GET .../reminders` |

### 세부 권한 규칙

- `owner`만 다른 사용자의 역할을 변경할 수 있다.
- `operator`는 자신보다 높은 권한을 부여할 수 없다.
- `operators_only` 리소스는 일반 회원에게 목록과 상세 모두 숨긴다.
- 일반 회원은 본인에게 부과된 회비만 조회한다.
- 일반 회원은 본인이 속한 모임 리소스만 접근할 수 있다.
- MVP 인증: `x-crewith-role` 헤더로 역할 전달 (Firebase Auth 연동 후 Bearer JWT로 전환 예정).

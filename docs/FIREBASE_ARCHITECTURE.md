# Crewith Firebase 아키텍처

## 목적

Crewith MVP는 NestJS API와 로컬 JSON 영속성으로 시작하지만, 프로덕션 목표는 Firebase 기반 인프라다. 이 문서는 현재 API 계약을 유지하면서 Firebase로 전환할 수 있도록 Firebase 구조를 정의한다.

---

## Firebase 서비스 구성

| 영역 | Firebase 서비스 | 용도 |
|---|---|---|
| 인증 | Firebase Authentication | 회원/운영진 휴대폰 OTP 로그인. MVP는 SMS 전화 인증 사용. PASS 본인인증은 추후 추가 가능. |
| 데이터베이스 | Cloud Firestore | 모임, 멤버십, 회비, 일정, 공지, 열람, 반응, 가입 신청, 초대 링크, 알림 로그. |
| 서버 로직 | Cloud Functions for Firebase | 역할 보호 쓰기, 정기 회비 생성, 리마인더 대상 산정, FCM 발송, 초대 수락, 데이터 정리. |
| 호스팅 | Firebase Hosting | 관리자 웹 정적/SSR 배포. SSR 요구가 커지면 Cloud Run 연동 고려. |
| 푸시 | Firebase Cloud Messaging | 회비 리마인더, 미확인 공지, 일정 알림, 가입 신청 결과 앱 푸시. |
| 파일 | Firebase Storage | 회원 프로필 사진. |

---

## Firestore 컬렉션 구조

모임별 운영 데이터는 `clubs/{clubId}` 하위 서브컬렉션으로 관리한다.

```
users/{userId}
clubs/{clubId}
clubs/{clubId}/members/{memberId}
clubs/{clubId}/joinRequests/{requestId}
clubs/{clubId}/inviteLinks/{inviteId}
clubs/{clubId}/fees/{feeId}
clubs/{clubId}/fees/{feeId}/payments/{memberId}
clubs/{clubId}/events/{eventId}
clubs/{clubId}/events/{eventId}/responses/{memberId}
clubs/{clubId}/events/{eventId}/attendance/{memberId}
clubs/{clubId}/notices/{noticeId}
clubs/{clubId}/notices/{noticeId}/reads/{memberId}
clubs/{clubId}/notices/{noticeId}/comments/{commentId}
clubs/{clubId}/notices/{noticeId}/reactions/{memberId}
clubs/{clubId}/notificationLogs/{notificationId}
users/{userId}/devices/{deviceId}
```

---

## 컬렉션별 주요 필드

### users/{userId}

```
phoneNumber: string         // 국제 형식, Firebase Auth uid와 연결
name: string
birthDate: string | null    // ISO 8601 날짜
gender: string | null       // male | female | other
profileImageUrl: string | null
status: string              // active | deleted
createdAt: Timestamp
updatedAt: Timestamp
```

### clubs/{clubId}

```
name: string
sportType: string
visibility: string          // public | private
ownerUserId: string
trialStartedAt: Timestamp
trialEndsAt: Timestamp
subscriptionTier: string    // under_30 | under_100 | under_300
subscriptionStatus: string  // trial | active | expired | suspended
createdAt: Timestamp
updatedAt: Timestamp
```

### clubs/{clubId}/members/{memberId}

`memberId`는 `userId`와 동일하게 사용하여 멤버십 조회를 단순화한다.

```
userId: string
role: string                // owner | operator | member
memberStatus: string        // active | dormant | left | removed
joinedAt: Timestamp
leftAt: Timestamp | null
personalDataDeleteAt: Timestamp | null   // left/removed 후 30일
grade: string | null
createdAt: Timestamp
updatedAt: Timestamp
```

### clubs/{clubId}/fees/{feeId}

```
title: string
feeType: string             // recurring | one_time
amount: number
dueDate: string             // ISO 8601 날짜
visibility: string          // all_members | selected_members
selectedMemberIds: string[] // visibility가 selected_members일 때
createdBy: string
createdAt: Timestamp
updatedAt: Timestamp
```

### clubs/{clubId}/fees/{feeId}/payments/{memberId}

`memberId` 를 문서 ID로 사용하여 회원별 납부 상태를 직접 조회한다.

```
status: string              // unpaid | paid | exempt
paidAt: Timestamp | null
recordedBy: string | null
createdAt: Timestamp
updatedAt: Timestamp
```

### clubs/{clubId}/events/{eventId}

```
title: string
description: string
startsAt: Timestamp
endsAt: Timestamp | null
visibility: string          // all_members | operators_only
responseDeadline: Timestamp | null
locationName: string | null
locationAddress: string | null
latitude: number | null
longitude: number | null
createdBy: string
createdAt: Timestamp
updatedAt: Timestamp
```

### clubs/{clubId}/events/{eventId}/responses/{memberId}

```
response: string            // attending | not_attending
respondedAt: Timestamp
```

### clubs/{clubId}/events/{eventId}/attendance/{memberId}

```
status: string              // present | late | absent
companionCount: number
checkedBy: string
checkedAt: Timestamp
```

### clubs/{clubId}/notices/{noticeId}

```
title: string
body: string
visibility: string          // all_members | operators_only
createdBy: string
createdAt: Timestamp
updatedAt: Timestamp
deletedAt: Timestamp | null
```

### clubs/{clubId}/notices/{noticeId}/reads/{memberId}

```
readAt: Timestamp
```

### clubs/{clubId}/notices/{noticeId}/comments/{commentId}

```
memberId: string
body: string
createdAt: Timestamp
updatedAt: Timestamp
deletedAt: Timestamp | null
```

### clubs/{clubId}/notices/{noticeId}/reactions/{memberId}

```
reactionType: string        // like
createdAt: Timestamp
```

### clubs/{clubId}/joinRequests/{requestId}

```
userId: string
applicantName: string
applicantPhone: string
greeting: string
status: string              // pending | approved | rejected
reviewedBy: string | null
reviewedAt: Timestamp | null
createdAt: Timestamp
```

### clubs/{clubId}/inviteLinks/{inviteId}

```
tokenHash: string           // SHA-256 해시, unique 인덱스
expiresAt: Timestamp
createdBy: string
disabledAt: Timestamp | null
createdAt: Timestamp
```

### users/{userId}/devices/{deviceId}

```
platform: string            // android | ios
fcmToken: string
lastSeenAt: Timestamp
createdAt: Timestamp
```

### clubs/{clubId}/notificationLogs/{notificationId}

```
userId: string
type: string                // notice | event | fee | join_request
title: string
body: string
deepLink: string | null
scheduledAt: Timestamp | null
sentAt: Timestamp | null
readAt: Timestamp | null
createdAt: Timestamp
```

---

## 모임별 데이터 분리 방식

- 모든 운영 데이터는 `clubs/{clubId}` 하위 서브컬렉션으로 격리된다.
- 다른 모임의 데이터에 접근하려면 해당 모임의 멤버십이 있어야 한다.
- Security Rules에서 `clubs/{clubId}/members/{request.auth.uid}` 문서 존재 여부를 확인하여 접근을 제한한다.
- 모임 간 데이터 공유는 없으며, 공통 집계도 각 모임 내에서만 수행한다.

---

## 회원별 여러 모임 가입 구조

- `users/{userId}` 문서는 서비스 계정 단위의 전역 정보를 저장한다.
- 각 모임 가입 정보는 `clubs/{clubId}/members/{userId}` 서브컬렉션 문서로 분리된다.
- 회원이 가입한 모임 목록은 Firestore Collection Group Query를 사용하여 조회한다:

```javascript
// 회원이 가입한 모임 목록 조회
const memberships = await db
  .collectionGroup('members')
  .where('userId', '==', uid)
  .where('memberStatus', 'in', ['active', 'dormant'])
  .get();
```

- 역할과 상태는 모임마다 독립적으로 관리된다. 동일 사용자가 모임 A에서는 operator, 모임 B에서는 member일 수 있다.

---

## 역할 기반 권한 구조

역할은 `clubs/{clubId}/members/{memberId}.role` 필드로 관리한다.

| 역할 | 접근 범위 |
|---|---|
| owner | 모임 전체 관리, 역할 변경, 구독 설정, owner 이전 가능 |
| operator | 회원·회비·일정·공지·가입 신청·초대·리마인더 관리. owner 이전 불가. |
| member | 본인 프로필, 본인 일정 응답, 공개 설정된 공지/일정, 본인 회비 상태 조회 |

Security Rules에서 역할 검증:

```javascript
function getMemberRole(clubId) {
  return get(/databases/$(database)/documents/clubs/$(clubId)/members/$(request.auth.uid)).data.role;
}

function isOperatorOrAbove(clubId) {
  let role = getMemberRole(clubId);
  return role == 'owner' || role == 'operator';
}

function isOwner(clubId) {
  return getMemberRole(clubId) == 'owner';
}
```

현재 개발 API는 `x-crewith-role` 헤더로 이 경계를 시뮬레이션한다. 프로덕션에서는 Firebase Auth ID 토큰 검증 + 서버 측 역할 조회로 교체한다.

---

## Firebase Auth 사용 방식

### MVP SMS 인증 흐름

1. 앱에서 `firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier)` 호출
2. Firebase가 SMS OTP 발송
3. 앱에서 OTP 입력 후 `confirmationResult.confirm(otp)` 호출
4. Firebase Auth에서 ID 토큰 발급
5. 앱이 ID 토큰을 NestJS API에 전달 (Bearer 헤더)
6. API는 Firebase Admin SDK로 ID 토큰 검증 및 `uid` 추출
7. `uid` 기준으로 `users/{uid}` 문서 조회 또는 신규 생성

### 개발 환경 OTP

- Firebase Auth Emulator 사용 시 테스트 번호와 고정 OTP(`123456`)를 등록하여 사용
- 실제 SMS 발송 없이 로컬 개발 가능

### 신규 사용자 감지

- ID 토큰 검증 후 `users/{uid}` 문서가 없으면 신규 사용자로 판단
- 프로필 입력 화면으로 라우팅

---

## FCM 토큰 저장 구조

- 앱 시작 시 `FirebaseMessaging.instance.getToken()`으로 FCM 토큰 획득
- 토큰을 `users/{userId}/devices/{deviceId}` 에 저장
- `deviceId`는 앱 설치 단위 UUID (앱 로컬 저장소에 영속)
- 토큰 갱신 시 `onTokenRefresh` 리스너에서 자동 업데이트

### 알림 발송 흐름

1. Cloud Function (또는 NestJS API + Firebase Admin SDK)에서 대상 userId 목록 산정
2. `users/{userId}/devices` 컬렉션에서 활성 FCM 토큰 수집
3. FCM `sendMulticast` 또는 `send` 호출
4. 발송 결과를 `clubs/{clubId}/notificationLogs`에 저장
5. 만료/무효 토큰은 발송 결과에서 감지하여 삭제

---

## Cloud Functions 책임 범위

| Function | 트리거 | 책임 |
|---|---|---|
| `generateRecurringFees` | 스케줄 (매일 자정) | 납부일/간격 기준으로 회비 항목과 회원별 납부 상태 자동 생성 |
| `sendFeeReminders` | 스케줄/수동 호출 | 유예기간 경과 미납 회원 산정 후 FCM 발송 |
| `sendNoticeUnreadReminders` | 스케줄/수동 호출 | 공지별 미확인 대상 산정 후 FCM 발송 |
| `sendEventReminders` | 스케줄/수동 호출 | 응답 마감 전 미응답 회원 산정 후 FCM 발송 |
| `cleanupMemberPersonalData` | 스케줄 (매일) | `personalDataDeleteAt` 경과 회원의 개인정보 필드 삭제. 회비/출석 이력은 익명화 참조로 보존. |
| `acceptInviteLink` | HTTPS Callable | 토큰 유효성(만료·비활성화) 검증 후 멤버십 생성 |
| `onJoinRequestApproved` | Firestore 트리거 | 가입 신청 승인 시 FCM 발송 |
| `onClubMemberCreated` | Firestore 트리거 | 신규 회원 등록 시 기존 미납 회비 납부 상태 생성 |

---

## Firestore Security Rules 초안

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 헬퍼 함수
    function isAuthenticated() {
      return request.auth != null;
    }

    function getMember(clubId) {
      return get(/databases/$(database)/documents/clubs/$(clubId)/members/$(request.auth.uid)).data;
    }

    function isMember(clubId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/clubs/$(clubId)/members/$(request.auth.uid)) &&
        getMember(clubId).memberStatus in ['active', 'dormant'];
    }

    function isOperatorOrAbove(clubId) {
      return isMember(clubId) && getMember(clubId).role in ['owner', 'operator'];
    }

    function isOwner(clubId) {
      return isMember(clubId) && getMember(clubId).role == 'owner';
    }

    // 사용자 문서
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if isAuthenticated() && request.auth.uid == userId;

      match /devices/{deviceId} {
        allow read, write: if isAuthenticated() && request.auth.uid == userId;
      }
    }

    // 모임 문서
    match /clubs/{clubId} {
      allow read: if isMember(clubId);
      allow create: if isAuthenticated(); // 모임 생성은 모든 인증 사용자
      allow update: if isOwner(clubId);
      allow delete: if false; // 모임 삭제는 Functions에서만

      // 회원 목록
      match /members/{memberId} {
        allow read: if isMember(clubId);
        allow write: if isOperatorOrAbove(clubId);
        // 본인 프로필 수정 허용 필드 제한
        allow update: if isAuthenticated() && request.auth.uid == memberId
          && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['grade']); // 회원이 수정 가능한 필드만 허용
      }

      // 가입 신청
      match /joinRequests/{requestId} {
        allow read: if isOperatorOrAbove(clubId);
        allow create: if isAuthenticated(); // 비회원도 신청 가능
        allow update: if isOperatorOrAbove(clubId);
      }

      // 초대 링크
      match /inviteLinks/{inviteId} {
        allow read: if isOperatorOrAbove(clubId);
        allow write: if isOperatorOrAbove(clubId);
      }

      // 회비
      match /fees/{feeId} {
        allow read: if isMember(clubId);
        allow write: if isOperatorOrAbove(clubId);

        match /payments/{memberId} {
          // 본인 납부 상태 조회 가능
          allow read: if isAuthenticated() &&
            (request.auth.uid == memberId || isOperatorOrAbove(clubId));
          // 납부 상태 변경은 운영진만
          allow write: if isOperatorOrAbove(clubId);
        }
      }

      // 일정
      match /events/{eventId} {
        // 운영진 전용 일정 필터링
        allow read: if isMember(clubId) &&
          (resource.data.visibility == 'all_members' || isOperatorOrAbove(clubId));
        allow write: if isOperatorOrAbove(clubId);

        match /responses/{memberId} {
          allow read: if isMember(clubId);
          // 본인 응답만 쓰기 가능, 마감 전에만
          allow write: if isAuthenticated() && request.auth.uid == memberId;
        }

        match /attendance/{memberId} {
          allow read: if isMember(clubId);
          allow write: if isOperatorOrAbove(clubId);
        }
      }

      // 공지
      match /notices/{noticeId} {
        allow read: if isMember(clubId) &&
          (resource.data.visibility == 'all_members' || isOperatorOrAbove(clubId));
        allow write: if isOperatorOrAbove(clubId);

        match /reads/{memberId} {
          allow read: if isMember(clubId);
          // 본인 확인 처리만 가능
          allow create: if isAuthenticated() && request.auth.uid == memberId;
        }

        match /comments/{commentId} {
          allow read: if isMember(clubId);
          allow create: if isMember(clubId);
          // 본인 댓글만 수정/삭제
          allow update, delete: if isAuthenticated() &&
            resource.data.memberId == request.auth.uid;
        }

        match /reactions/{memberId} {
          allow read: if isMember(clubId);
          allow write: if isAuthenticated() && request.auth.uid == memberId;
        }
      }

      // 알림 로그
      match /notificationLogs/{notificationId} {
        allow read: if isOperatorOrAbove(clubId);
        allow write: if false; // Functions에서만 쓰기
      }
    }
  }
}
```

> **가정**: 복잡한 응답 마감일 검증(마감 후 쓰기 차단)은 Security Rules보다 Cloud Functions 또는 NestJS API에서 처리하는 것이 유지보수에 유리하다. Rules는 인증/역할 경계에만 집중한다.

---

## 로컬 개발 / 운영 환경 분리

### 로컬 개발 환경

```
FIREBASE_PROJECT_ID=crewith-dev (또는 emulator)
```

- Firebase Emulator Suite 사용 (Auth, Firestore, Functions, Storage)
- `firebase emulators:start` 로 로컬 기동
- 앱/API 코드에서 emulator host 설정:

```typescript
// NestJS API - Firebase Admin SDK
if (process.env.NODE_ENV === 'development') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}
```

```dart
// Flutter
if (kDebugMode) {
  await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
  FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
}
```

- 로컬에서는 JSON 파일 기반 저장소(NestJS MVP 단계)를 사용하며 Firebase 의존성 없이 개발 가능

### 운영 환경

```
FIREBASE_PROJECT_ID=crewith-prod
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_STORAGE_BUCKET=crewith-prod.appspot.com
FCM_SENDER_ID=...
ADMIN_WEB_ORIGIN=https://admin.crewith.app
```

- Firebase 프로젝트를 dev/prod 두 개로 분리하여 운영
- 관리자 웹은 Firebase Hosting 또는 Vercel에 배포
- API는 Railway 또는 Cloud Run에 배포

### 환경 전환 방법

| 항목 | 로컬 | 운영 |
|---|---|---|
| Auth | Emulator (`localhost:9099`) | Firebase Auth |
| Firestore | Emulator (`localhost:8080`) | Cloud Firestore |
| Functions | Emulator (`localhost:5001`) | Cloud Functions |
| FCM | 로그만 출력 | 실제 발송 |
| 스토리지 | Emulator 또는 생략 | Firebase Storage |

---

## 마이그레이션 계획

1. NestJS API 계약 유지 (엔드포인트, 요청/응답 형식 변경 없음)
2. `mvp.store.ts` 를 리포지토리 인터페이스로 추상화
3. `JsonMvpRepository` — 로컬 개발용 JSON 파일 기반
4. `FirestoreMvpRepository` — Firebase Admin SDK 기반
5. 역할 체크를 `x-crewith-role` 헤더에서 Firebase ID 토큰 검증으로 교체
6. 리마인더 발송을 로그 기록에서 실제 FCM 발송으로 교체
7. 환경별 Firebase 프로젝트 ID로 관리자 웹과 API 배포

# Crewith Firestore Security Rules 초안

## 작성 기준

- 이 문서는 MVP 프로덕션 배포 전 검토가 필요한 초안이다.
- 실제 배포 가능한 완성본이 아니며, 구현 시 추가 검증이 필요하다.
- 복잡한 비즈니스 로직(응답 마감일 검증, 납부 상태 전이 등)은 Security Rules 대신 Cloud Functions 또는 NestJS API에서 처리한다.
- Rules는 인증/역할/소속 경계에 집중한다.

---

## 핵심 보안 원칙

1. **비인증 접근 전면 차단** — `request.auth != null` 없으면 모든 읽기/쓰기 거부
2. **모임 멤버십 검증** — 모든 `clubs/{clubId}` 하위 접근 전에 해당 모임 멤버임을 확인
3. **역할 기반 쓰기 제한** — 운영진만 관리자 작업 가능
4. **운영진 전용 리소스 접근 차단** — 일반 회원은 `operators_only` 문서 읽기 불가
5. **본인 데이터만 쓰기 허용** — 회원은 본인 응답/확인/반응만 수정 가능

---

## Security Rules 전체 코드

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================================
    // 헬퍼 함수
    // ============================================================

    // 인증된 사용자인지 확인
    function isAuthenticated() {
      return request.auth != null;
    }

    // 특정 모임의 멤버 문서 조회
    function getMemberDoc(clubId) {
      return get(/databases/$(database)/documents/clubs/$(clubId)/members/$(request.auth.uid)).data;
    }

    // 특정 모임에 활성 멤버로 가입되어 있는지 확인
    function isActiveMember(clubId) {
      return isAuthenticated()
        && exists(/databases/$(database)/documents/clubs/$(clubId)/members/$(request.auth.uid))
        && getMemberDoc(clubId).memberStatus in ['active', 'dormant'];
    }

    // 운영진(operator) 이상 권한인지 확인
    function isOperatorOrAbove(clubId) {
      return isActiveMember(clubId)
        && getMemberDoc(clubId).role in ['owner', 'operator'];
    }

    // 모임장(owner) 권한인지 확인
    function isOwner(clubId) {
      return isActiveMember(clubId)
        && getMemberDoc(clubId).role == 'owner';
    }

    // 현재 사용자가 문서 소유자인지 확인 (memberId가 uid와 일치)
    function isSelf(memberId) {
      return isAuthenticated() && request.auth.uid == memberId;
    }

    // 수정된 필드가 허용된 목록에만 포함되는지 확인
    function onlyUpdates(allowedKeys) {
      return request.resource.data.diff(resource.data).affectedKeys().hasOnly(allowedKeys);
    }

    // ============================================================
    // 사용자 문서
    // ============================================================

    match /users/{userId} {
      // 본인 문서만 읽기/쓰기 가능
      allow read: if isSelf(userId);
      allow create: if isSelf(userId);
      allow update: if isSelf(userId)
        && onlyUpdates(['name', 'birthDate', 'gender', 'profileImageUrl', 'updatedAt']);
      allow delete: if false; // 계정 삭제는 Functions에서만

      // 디바이스(FCM 토큰) 관리
      match /devices/{deviceId} {
        allow read: if isSelf(userId);
        allow create, update: if isSelf(userId);
        allow delete: if isSelf(userId);
      }

      // 모임 멤버십 요약 (빠른 목록 조회용 캐시)
      match /clubMemberships/{clubId} {
        allow read: if isSelf(userId);
        allow write: if false; // Functions에서만 관리
      }
    }

    // ============================================================
    // 모임 문서
    // ============================================================

    match /clubs/{clubId} {
      // 가입된 멤버만 모임 정보 읽기 가능
      allow read: if isActiveMember(clubId);

      // 모임 생성은 인증된 모든 사용자 가능
      allow create: if isAuthenticated();

      // 모임 정보 수정은 owner만 가능
      allow update: if isOwner(clubId);

      // 모임 삭제는 Functions에서만
      allow delete: if false;

      // ----------------------------------------------------------
      // 구성원 (members)
      // ----------------------------------------------------------

      match /members/{memberId} {
        // 가입된 멤버는 구성원 목록 읽기 가능
        // 개인정보 공개 설정에 따른 필드 제한은 API/Functions에서 처리
        allow read: if isActiveMember(clubId);

        // 운영진만 구성원 추가/수정 가능
        allow create: if isOperatorOrAbove(clubId);
        allow update: if isOperatorOrAbove(clubId)
          || (isSelf(memberId) && onlyUpdates(['grade', 'updatedAt']));

        // 삭제는 Functions에서만 (removed 상태 전환)
        allow delete: if false;
      }

      // ----------------------------------------------------------
      // 가입 신청 (joinRequests)
      // ----------------------------------------------------------

      match /joinRequests/{requestId} {
        // 운영진만 가입 신청 목록 조회 가능
        allow read: if isOperatorOrAbove(clubId);

        // 인증된 모든 사용자가 신청 가능 (공개 모임)
        allow create: if isAuthenticated()
          && request.resource.data.status == 'pending';

        // 승인/거절은 운영진만 가능
        allow update: if isOperatorOrAbove(clubId);

        allow delete: if false;
      }

      // ----------------------------------------------------------
      // 초대 링크 (inviteLinks)
      // ----------------------------------------------------------

      match /inviteLinks/{inviteId} {
        // 운영진만 초대 링크 관리 가능
        allow read: if isOperatorOrAbove(clubId);
        allow create: if isOperatorOrAbove(clubId);

        // 비활성화는 운영진만
        allow update: if isOperatorOrAbove(clubId)
          && onlyUpdates(['disabledAt', 'updatedAt']);

        allow delete: if false;
      }

      // ----------------------------------------------------------
      // 회비 항목 (fees)
      // ----------------------------------------------------------

      match /fees/{feeId} {
        // 운영진은 전체 항목, 일반 회원은 본인 관련 항목만
        // 세밀한 필터링은 API에서 처리
        allow read: if isActiveMember(clubId);

        // 운영진만 회비 항목 생성/수정 가능
        allow create, update: if isOperatorOrAbove(clubId);
        allow delete: if isOperatorOrAbove(clubId);

        // 납부 상태 (payments)
        match /payments/{memberId} {
          // 본인 납부 상태 또는 운영진만 읽기 가능
          allow read: if isSelf(memberId) || isOperatorOrAbove(clubId);

          // 납부 상태 변경은 운영진만
          allow create, update: if isOperatorOrAbove(clubId);
          allow delete: if false;
        }
      }

      // ----------------------------------------------------------
      // 일정 (events)
      // ----------------------------------------------------------

      match /events/{eventId} {
        // operators_only 일정은 운영진만 읽기 가능
        allow read: if isActiveMember(clubId)
          && (resource == null
            || resource.data.visibility == 'all_members'
            || isOperatorOrAbove(clubId));

        // 일정 생성/수정/삭제는 운영진만
        allow create, update, delete: if isOperatorOrAbove(clubId);

        // 참석 의사 응답 (responses)
        match /responses/{memberId} {
          // 운영진은 전체 응답, 일반 회원은 본인 응답만
          allow read: if isActiveMember(clubId);

          // 본인 응답만 쓰기 가능
          // 마감일 검증은 API/Functions에서 처리
          allow create, update: if isSelf(memberId);
          allow delete: if isSelf(memberId);
        }

        // 실제 출석부 (attendance)
        match /attendance/{memberId} {
          // 운영진은 전체, 일반 회원은 본인만
          allow read: if isSelf(memberId) || isOperatorOrAbove(clubId);

          // 출석 체크는 운영진만
          allow create, update: if isOperatorOrAbove(clubId);
          allow delete: if false;
        }
      }

      // ----------------------------------------------------------
      // 공지 (notices)
      // ----------------------------------------------------------

      match /notices/{noticeId} {
        // operators_only 공지는 운영진만 읽기 가능
        allow read: if isActiveMember(clubId)
          && (resource == null
            || resource.data.visibility == 'all_members'
            || isOperatorOrAbove(clubId));

        // 공지 생성/수정/삭제는 운영진만
        allow create, update, delete: if isOperatorOrAbove(clubId);

        // 공지 확인 기록 (reads)
        match /reads/{memberId} {
          // 운영진은 전체, 일반 회원은 본인만
          allow read: if isSelf(memberId) || isOperatorOrAbove(clubId);

          // 본인 확인만 생성 가능 (수정/삭제 불가)
          allow create: if isSelf(memberId);
          allow update, delete: if false;
        }

        // 댓글 (comments)
        match /comments/{commentId} {
          // 공지 읽기 권한이 있는 멤버만 댓글 읽기 가능
          allow read: if isActiveMember(clubId);

          // 멤버는 댓글 작성 가능
          allow create: if isActiveMember(clubId)
            && request.resource.data.memberId == request.auth.uid;

          // 본인 댓글 수정, 운영진은 모든 댓글 삭제 가능
          allow update: if isAuthenticated()
            && resource.data.memberId == request.auth.uid
            && onlyUpdates(['body', 'updatedAt']);
          allow delete: if (isAuthenticated() && resource.data.memberId == request.auth.uid)
            || isOperatorOrAbove(clubId);
        }

        // 좋아요/반응 (reactions)
        match /reactions/{memberId} {
          allow read: if isActiveMember(clubId);

          // 본인 반응만 토글 (생성/삭제)
          allow create, delete: if isSelf(memberId);
          allow update: if false;
        }
      }

      // ----------------------------------------------------------
      // 알림 로그 (notificationLogs)
      // ----------------------------------------------------------

      match /notificationLogs/{notificationId} {
        // 운영진만 알림 로그 조회 가능
        allow read: if isOperatorOrAbove(clubId);

        // 모든 쓰기는 Functions에서만
        allow write: if false;
      }
    }
  }
}
```

---

## 설계 결정 및 가정

### 결정된 사항

| 항목 | 결정 |
|---|---|
| 비인증 접근 | 전면 차단 |
| 개인정보 공개 설정 필드 필터링 | API/Functions 담당 (Rules에서 처리 어려움) |
| 응답 마감일 검증 | API/Functions 담당 |
| 납부 상태 전이 유효성 | API/Functions 담당 |
| 탈퇴 회원 접근 | `memberStatus in ['active', 'dormant']`만 허용 |
| operators_only 필터 | `resource.data.visibility == 'all_members'` 조건으로 처리 |

### 미결 사항

| 항목 | 현황 |
|---|---|
| 초대 링크 수락 | 비회원(미가입자)이 직접 접근 필요 → 별도 공개 엔드포인트 또는 Functions 필요 |
| 가입 신청 (비회원) | 미가입 상태에서 신청 가능해야 함 → `clubId` 접근 전 멤버십 체크 우회 필요 |
| 탈퇴 후 데이터 접근 | left/removed 상태 회원은 Rules에서 차단 → 본인 데이터 export 정책 검토 필요 |
| owner 이전 원자성 | owner 역할 이전 시 기존 owner 동시 역할 변경 → Functions 트랜잭션 필요 |

---

## 공개 접근이 필요한 예외 케이스

아래 작업은 일반 Firestore Rules로 처리하기 어려워 HTTPS Callable Functions 또는 별도 API로 처리한다.

| 작업 | 이유 |
|---|---|
| 초대 링크 수락 | 미가입 사용자가 토큰으로 접근 → 토큰 검증 + 멤버십 생성 트랜잭션 |
| 공개 모임 가입 신청 | 모임 멤버가 아닌 사용자의 신청 → joinRequests 생성 허용 조건 분리 필요 |
| 공개 모임 정보 조회 | `visibility: public` 모임은 비회원도 기본 정보 조회 가능해야 할 수 있음 |

---

## Rules Emulator 테스트 시나리오

로컬 개발 시 Firebase Rules Simulator 또는 `firebase emulators:start`로 아래 케이스를 검증한다.

| 케이스 | 기대 결과 |
|---|---|
| 비인증으로 clubs 읽기 | 거부 |
| 멤버 아닌 사용자로 clubs/{clubId} 읽기 | 거부 |
| 일반 회원으로 operators_only 공지 읽기 | 거부 |
| 일반 회원으로 다른 회원 납부 상태 읽기 | 거부 |
| 일반 회원으로 회비 항목 생성 | 거부 |
| 일반 회원으로 본인 이벤트 응답 생성 | 허용 |
| 운영진으로 일정 생성 | 허용 |
| 운영진으로 출석부 저장 | 허용 |
| 다른 모임 clubId로 접근 | 거부 |
| owner로 구성원 역할 변경 | 허용 |

# Claude Task 02: Firebase 아키텍처 설계 보강

## 목표

Crewith 1차 MVP를 Firebase 기반으로 전환할 때 필요한 데이터 구조, 권한, 인증, 알림 설계를 문서화한다.

## 작업 범위

수정할 파일:

- `docs/FIREBASE_ARCHITECTURE.md`

필요하면 새 파일을 추가할 수 있다.

- `docs/FIREBASE_SECURITY_RULES_DRAFT.md`

## 세부 작업

### 1. Firestore 데이터 모델

아래 구조를 기준으로 컬렉션 설계를 작성한다.

- `clubs`
- `clubs/{clubId}/members`
- `clubs/{clubId}/fees`
- `clubs/{clubId}/feePayments`
- `clubs/{clubId}/events`
- `clubs/{clubId}/eventResponses`
- `clubs/{clubId}/attendance`
- `clubs/{clubId}/notices`
- `clubs/{clubId}/noticeReads`
- `clubs/{clubId}/noticeLikes`
- `clubs/{clubId}/noticeComments`
- `clubs/{clubId}/joinRequests`
- `clubs/{clubId}/inviteLinks`
- `users`
- `users/{userId}/clubMemberships`
- `users/{userId}/fcmTokens`

각 컬렉션마다 다음을 작성한다.

- 목적
- 주요 필드
- 읽기 권한
- 쓰기 권한
- 인덱스 필요 가능성

### 2. 인증 설계

아래 내용을 포함한다.

- Firebase Auth 사용 방식
- MVP SMS 인증 방식
- 추후 PASS/NICE/KMC 확장 여지
- 휴대폰 번호와 사용자 계정 매핑
- 한 사용자가 여러 모임에 가입하는 구조

### 3. 권한 설계

역할은 아래 3단계로 시작한다.

- `owner`
- `operator`
- `member`

문서에 포함할 내용:

- 역할별 가능한 작업
- 모임별 권한 분리
- 운영진 전용 공지/일정 접근 제어
- 탈퇴/강퇴/삭제된 회원 처리

### 4. FCM/Cloud Functions 설계

포함할 내용:

- FCM 토큰 저장 구조
- 미납 회비 리마인더
- 일정 참석 응답 리마인더
- 공지 미확인 리마인더
- 알림 발송 로그
- 실패/재시도 정책 초안

### 5. Security Rules 초안

Firestore Security Rules 초안을 문서 수준으로 작성한다.

실제 배포 가능한 완성본이 아니어도 되지만 아래 조건은 표현해야 한다.

- 로그인한 사용자만 읽기 가능
- 가입된 모임 데이터만 접근 가능
- 운영진만 관리자 작업 가능
- 회원은 본인 응답/확인 상태만 수정 가능
- 운영진 전용 리소스는 일반 회원이 읽을 수 없음

## 제약

- 코드 수정 금지
- Firebase 콘솔 작업 금지
- 문서만 수정
- 문서는 한국어로 작성
- 모호한 내용은 `가정` 섹션에 분리

## 완료 보고

작업 완료 후 다음을 알려준다.

- 변경한 파일 목록
- 설계상 아직 결정이 필요한 항목
- 구현 시 위험한 권한/보안 포인트

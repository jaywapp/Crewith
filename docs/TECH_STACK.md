# Crewith 기술 스택

## 1. 목표

Crewith MVP는 빠르게 개발하고 운영 검증을 시작할 수 있어야 한다. 동시에 회비, 출석, 권한, 공지 확인 여부처럼 관계가 많은 데이터를 안정적으로 다룰 수 있어야 하므로 Firebase 올인보다 API 서버와 PostgreSQL 중심 구조를 사용한다.

## 2. 최종 권장 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 관리자 웹 | Next.js | 운영 화면, 테이블, 폼, 배포 생태계가 안정적 |
| 모바일 앱 | Flutter | Android 우선, 추후 iOS 확장 가능 |
| 백엔드 | NestJS | TypeScript 일관성, 모듈 구조, 인증/권한 구현에 적합 |
| DB | PostgreSQL | 모임, 회원, 회비, 일정, 공지 관계형 데이터에 적합 |
| ORM | Prisma | NestJS와 조합이 좋고 마이그레이션/타입 안정성 확보 |
| 푸시 | Firebase Cloud Messaging | Android 푸시 표준 |
| 파일 저장 | Cloudflare R2 우선, S3 호환 | 프로필 사진 저장, 비용 예측 용이 |
| 관리자 웹 배포 | Vercel | Next.js 배포와 프리뷰 환경 구성 용이 |
| API 배포 | Railway 우선 | NestJS + PostgreSQL MVP 배포가 단순 |
| DB 호스팅 | Railway PostgreSQL 우선 | API와 함께 초기 운영 단순화 |
| SMS 인증 | 국내 SMS 제공자 연동 | MVP는 휴대폰 번호 인증만 필요 |

## 3. 아키텍처 개요

```text
Flutter App
    |
    | REST API / FCM Token 등록
    v
NestJS API Server  ----->  PostgreSQL
    |
    | Presigned URL
    v
Cloudflare R2
    |
    | Push 발송
    v
Firebase Cloud Messaging

Next.js Admin Web
    |
    | REST API
    v
NestJS API Server
```

## 4. 저장소 구조 권장안

MVP는 모노레포로 시작한다.

```text
apps/
  admin-web/      # Next.js
  mobile-app/     # Flutter
  api/            # NestJS
packages/
  shared-types/   # API 타입, 공통 enum
  config/         # eslint, prettier 등
docs/
```

초기 개발 속도를 위해 관리자 웹과 API는 같은 TypeScript 생태계로 묶고, Flutter 앱은 API 계약을 문서와 generated client로 맞춘다.

## 5. 백엔드

### NestJS 모듈 구성

```text
AuthModule
UsersModule
ClubsModule
MembersModule
JoinRequestsModule
InviteLinksModule
FeesModule
EventsModule
NoticesModule
NotificationsModule
FilesModule
StatsModule
IntegrationsModule
JobsModule
```

### 백그라운드 작업

MVP에서 필요한 예약/반복 작업:

- 정기 회비 항목 생성
- 미납 상태 판단
- 미납 알림 발송
- 일정 알림 발송
- 공지 미확인 리마인드
- 탈퇴/강퇴/휴면 회원 개인정보 30일 후 삭제

초기에는 NestJS 스케줄러로 시작하고, 작업량이 늘면 큐 기반으로 확장한다.

## 6. 데이터베이스

PostgreSQL을 사용한다.

핵심 이유:

- 사용자가 여러 모임에 가입하고 모임마다 권한이 달라진다.
- 회비 항목과 납부 상태가 회원별로 연결된다.
- 일정의 사전 참석 의사와 실제 출석부가 분리된다.
- 공지 확인 여부, 댓글, 좋아요가 회원별로 연결된다.
- 관리자 통계가 관계형 집계를 많이 사용한다.

마이그레이션은 Prisma Migrate를 사용한다.

## 7. 인증

MVP:

- 휴대폰 번호 기반 SMS 인증
- 인증 성공 후 자체 JWT 발급
- Refresh Token 사용

추후:

- PASS, NICE, KMC 등 국내 본인인증 추가
- 소셜 로그인은 MVP 범위 외

## 8. 배포 전략

### MVP

| 구성 | 배포 |
|---|---|
| 관리자 웹 | Vercel |
| API 서버 | Railway |
| PostgreSQL | Railway PostgreSQL |
| 파일 저장 | Cloudflare R2 |
| 푸시 | Firebase Cloud Messaging |

### 실서비스 확장 후보

| 구성 | 후보 |
|---|---|
| API 서버 | AWS ECS Fargate |
| DB | AWS RDS PostgreSQL |
| 파일 저장 | S3 |
| CDN | CloudFront |
| 배치/큐 | SQS, EventBridge |

## 9. 환경 변수 초안

```text
DATABASE_URL=
API_BASE_URL=
CREWITH_API_BASE_URL=
CREWITH_DATA_FILE=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
SMS_PROVIDER_API_KEY=
SMS_PROVIDER_API_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
FCM_SENDER_ID=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NAVER_MAP_CLIENT_ID=
NAVER_MAP_CLIENT_SECRET=
```

## 10. 미정 사항

- SMS 제공자
- Railway 확정 여부
- Cloudflare R2 확정 여부
- 네이버 지도 API 세부 상품
- 작업 큐 도입 시점

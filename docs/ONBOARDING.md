# Crewith 개발 온보딩 가이드

## 프로젝트 개요

Crewith는 10~30명 규모 스포츠 동호회의 운영을 돕는 서비스다. 운영진(관리자 웹)과 회원(모바일 앱)으로 나뉜 듀얼 클라이언트 구조로, 회원 관리, 회비, 일정/출석, 공지, 알림을 통합 제공한다.

**현재 단계**: MVP 1차 개발 중. 기능 골격 완성 단계이며, Firebase 전환 전 NestJS + 로컬 JSON 스토어로 동작한다.

---

## 저장소 구조

```
crewith/
├── apps/
│   ├── admin-web/          # 관리자 웹 (Next.js 15)
│   ├── api/                # 백엔드 API (NestJS 11)
│   └── mobile-app/         # 회원 앱 (Flutter)
├── packages/
│   └── shared-types/       # 공유 TypeScript 타입
├── docs/                   # 기획/설계 문서 전체
└── package.json            # npm workspaces 루트
```

### 기술 스택 요약

| 레이어 | 기술 |
|---|---|
| 관리자 웹 | Next.js 15, React 19, TypeScript |
| API | NestJS 11, Prisma, TypeScript |
| 회원 앱 | Flutter (Dart) |
| 공유 타입 | TypeScript (npm workspace) |
| DB (MVP) | 로컬 JSON / Prisma (PostgreSQL 연결 예정) |
| 프로덕션 목표 | Firebase (Firestore, Auth, FCM, Storage) |

---

## 관리자 웹 역할

- 운영진(owner/operator)이 모임을 관리하는 웹 대시보드
- Next.js App Router 기반, `apps/admin-web/app/` 하위에 페이지 구성
- 현재 라우트: `/` (대시보드), `/members`, `/fees`, `/events`, `/notices`, `/join`, `/reminders`
- API 서버와 통신하여 데이터를 표시

---

## API 역할

- 관리자 웹과 회원 앱이 공통으로 사용하는 REST API
- Base URL: `/api/v1`
- 인증: Bearer JWT
- 모든 모임 리소스는 `clubId` 기준으로 접근 및 권한 검사
- 현재 MVP 단계에서는 로컬 JSON 파일 또는 Prisma(PostgreSQL)로 데이터 저장
- `src/auth/`: CurrentUser 데코레이터, ClubRoles 데코레이터 정의
- `src/prisma/`: Prisma 서비스 및 모듈

---

## 회원 앱 역할

- 일반 회원(member)과 운영진이 모바일에서 사용하는 Flutter 앱
- Android 우선 개발, iOS는 Beta 1 예정
- `lib/main.dart`에서 앱 진입점 및 기본 구조 정의
- API 서버와 통신하여 일정 응답, 공지 확인, 회비 조회 등 수행

---

## 로컬 실행 순서

### 사전 조건

- Node.js 22 이상
- npm 11 이상
- Flutter SDK 3.x 이상
- Android Studio (에뮬레이터 사용 시)

### 1. 의존성 설치

```bash
# 루트 디렉토리에서
npm ci
```

```bash
# Flutter 앱
cd apps/mobile-app
flutter pub get
```

### 2. API 서버 실행

```bash
# 루트 디렉토리에서
npm run dev:api
```

- 포트: `4000`
- 주소: `http://localhost:4000`
- 헬스 체크: `GET http://localhost:4000/api/v1/health`

### 3. 관리자 웹 실행

```bash
# 루트 디렉토리에서 (API 서버와 별도 터미널)
npm run dev:admin
```

- 포트: `3000`
- 주소: `http://localhost:3000`
- Next.js 핫 리로드 지원

### 4. Flutter 앱 실행

```bash
cd apps/mobile-app
flutter run
```

- Android 에뮬레이터 또는 실기기 연결 필요
- 개발 OTP: `123456`

### 5. 환경 변수 설정 (확인 필요)

```bash
# apps/api/.env 파일 생성 (예시)
PORT=4000
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
DATABASE_URL=postgresql://...
ADMIN_WEB_ORIGIN=http://localhost:3000
```

`.env.example` 파일을 참고하여 설정한다.

---

## 테스트 실행 순서

```bash
# API 테스트
npm run test -w @crewith/api

# 관리자 웹 타입 체크
npm run typecheck -w @crewith/admin-web

# Flutter 테스트
cd apps/mobile-app
flutter test
```

---

## 문서 읽는 순서

처음 합류한 개발자에게 권장하는 문서 순서:

| 순서 | 문서 | 목적 |
|---|---|---|
| 1 | [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | 서비스 정의, 타깃, 핵심 문제 |
| 2 | [MVP_SCOPE.md](MVP_SCOPE.md) | 무엇을 만들고 무엇을 제외하는지 |
| 3 | [DATA_MODEL.md](DATA_MODEL.md) | 핵심 데이터 구조 이해 |
| 4 | [API_SPEC.md](API_SPEC.md) | API 엔드포인트와 계약 |
| 5 | [SCREEN_SPEC.md](SCREEN_SPEC.md) | 화면 구성과 UI 흐름 |
| 6 | [ADMIN_USER_FLOW.md](ADMIN_USER_FLOW.md) | 관리자 웹 사용 흐름 |
| 7 | [MEMBER_APP_FLOW.md](MEMBER_APP_FLOW.md) | 회원 앱 사용 흐름 |
| 8 | [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md) | 개발 단계별 작업 목록 |
| 9 | [FIREBASE_ARCHITECTURE.md](FIREBASE_ARCHITECTURE.md) | 프로덕션 전환 설계 |
| 10 | [QA_CHECKLIST.md](QA_CHECKLIST.md) | 내가 맡은 기능의 QA 기준 |

---

## 현재 구현된 것

| 영역 | 구현 상태 |
|---|---|
| NestJS 프로젝트 기반 | 완료 |
| Prisma 스키마 초안 | 완료 |
| ConfigModule (환경변수) | 완료 |
| CurrentUser 데코레이터 | 완료 |
| ClubRoles 데코레이터 스켈레톤 | 완료 |
| JWT 인증 가드 | 구현 확인 필요 |
| 역할 기반 권한 가드 | 구현 확인 필요 |
| 관리자 웹 Next.js 기반 | 완료 |
| 관리자 웹 디자인 토큰/레이아웃 | 완료 |
| 관리자 웹 대시보드 (목업 포함) | 완료 |
| 관리자 웹 라우팅 구조 | 구현 확인 필요 |
| 관리자 웹 API 클라이언트 | 구현 확인 필요 |
| Flutter 앱 기본 구조 | 완료 |
| Flutter ThemeData | 구현 확인 필요 |
| Flutter 인증 상태 관리 | 구현 확인 필요 |
| Flutter API 클라이언트 | 구현 확인 필요 |
| 인프라 (Railway, Vercel, Firebase) | 미완성 |
| OTP 인증 API (`POST /auth/otp/request`, `/verify`) | 완료 |
| 모임 생성/목록/상세 API | 완료 |
| 회원 초대·가입 API (초대코드, 공개 모임) | 완료 |
| 일정 생성/조회/수정/삭제 API | 완료 |
| 공지 작성/조회/수정/삭제 API | 완료 |
| 회비 항목·납부 기록 API | 완료 |
| 출석 기록 API | 완료 |
| 리마인더 대상 산정 (`/reminders`) | 완료 |
| 개인정보 공개 설정 API (`GET/PUT /clubs/:clubId/privacy-settings`) | 완료 |
| 알림 설정 API (`GET/PUT /clubs/:clubId/notification-settings`) | 완료 |
| 구성원 목록 API (`GET /clubs/:clubId/member-app/:memberId/members`) | 완료 |
| 관리자 웹 설정 화면 (개인정보·알림 설정) | 완료 |
| FCM 실발송 / 자동 스케줄러 | 추후 구현 |

---

## 아직 남은 것 (Phase 0 → Phase 1)

### Phase 0 마무리

- JWT 인증 가드 완성
- 역할 기반 권한 가드 완성
- 관리자 웹 인증 상태 관리 및 API 클라이언트 연결
- Flutter 인증 플로우 및 API 클라이언트 연결
- Railway PostgreSQL 설정 및 Prisma 마이그레이션 적용
- Vercel 관리자 웹 배포 연결
- Firebase 프로젝트 생성 (FCM 초기 설정)

### Phase 1 (인증과 모임)

- SMS OTP 인증 API
- JWT/Refresh Token 발급
- 사용자 프로필 API
- 모임 생성/목록/상세 API
- 모임별 권한 모델

자세한 단계별 작업은 [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md)를 참고한다.

---

## 자주 묻는 것

**Q. Firebase는 언제 연동하나요?**  
MVP는 NestJS + 로컬 JSON/Prisma로 동작한다. Firebase 전환은 Phase 0 완료 후 또는 별도 마이그레이션 브랜치로 진행한다. 설계는 [FIREBASE_ARCHITECTURE.md](FIREBASE_ARCHITECTURE.md) 참고.

**Q. 네이버 지도 연동은 언제 하나요?**  
MVP 후순위. 일정 생성에서 텍스트 주소 입력으로 우선 처리하고, Beta에서 연동한다.

**Q. 실제 결제는 언제 하나요?**  
MVP 제외. Beta 1에서 구독 결제 연동 검토.

**Q. iOS 앱은 언제 하나요?**  
MVP는 Android 우선. Beta 1에서 iOS 검증 예정.

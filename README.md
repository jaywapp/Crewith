# Crewith

동호회와 모임을 위한 통합 관리 서비스 — 구성원, 회비, 일정, 공지사항을 한 곳에서 관리합니다.

## 개요

Crewith는 동호회·소모임 운영진이 Excel, 카카오톡, 별도 캘린더 앱에 분산되어 관리하던 업무를 하나의 서비스로 통합합니다.

- **구성원 명부 관리** — 가입 신청·승인, 역할(모임장 / 운영진 / 일반회원) 분리
- **회비 납부 관리** — 납부 기록 토글 입력, 미납 자동 알림
- **일정 / 참석 관리** — 참석 의사 사전 수집, 출석부 관리
- **공지사항** — 확인 여부 자동 추적, 미확인 회원 리마인드
- **통합 대시보드** — 회원 수, 회비 수납률, 참석률 등 핵심 지표 한눈에 확인

## 기술 스택

| 영역 | 기술 |
|------|------|
| 관리자 웹 | Next.js (Vercel 배포) |
| 모바일 앱 | Flutter (Android 우선) |
| 백엔드 API | NestJS + Prisma |
| 데이터베이스 | PostgreSQL (Railway) |
| 푸시 알림 | Firebase Cloud Messaging (FCM) |
| 파일 저장 | Cloudflare R2 |

## 프로젝트 구조

```
Crewith/
├── apps/
│   ├── api/           # NestJS 백엔드 API 서버
│   ├── admin-web/     # Next.js 관리자 웹
│   └── mobile-app/    # Flutter 모바일 앱
├── packages/
│   └── shared-types/  # 공유 TypeScript 타입
└── docs/              # 기획·설계·QA 문서
```

## 시작하기

### 요구 사항

- Node.js >= 22.0.0
- npm >= 11.0.0

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
# API 서버
npm run dev:api

# 관리자 웹
npm run dev:admin
```

### 빌드 및 타입 검사

```bash
npm run build
npm run typecheck
```

## 문서

상세 기획·설계 문서는 [`docs/`](docs/README.md) 폴더를 참고하세요.

## 라이선스

Private

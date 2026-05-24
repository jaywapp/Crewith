# Crewith

동호회와 모임의 구성원, 회비, 일정, 공지사항을 한 곳에서 관리하는 웹/앱 서비스입니다.

## 프로젝트 구조

```
apps/
  api/          # NestJS 백엔드 API 서버
  admin-web/    # Next.js 관리자 웹
  mobile-app/   # Flutter 모바일 앱 (Android 우선)
packages/
  shared-types/ # 공유 TypeScript 타입
docs/           # 기획, 설계, API 명세 등 문서
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| 관리자 웹 | Next.js |
| 모바일 앱 | Flutter |
| 백엔드 | NestJS + Prisma |
| 데이터베이스 | PostgreSQL |
| 푸시 알림 | Firebase Cloud Messaging |
| 파일 저장 | Cloudflare R2 |

## 문서

상세 기획·설계 문서는 [`docs/`](docs/README.md) 폴더를 참고하세요.

## AI 작성 안내

이 README 및 `docs/` 폴더의 문서는 [Claude](https://claude.ai) (Anthropic)가 작성하였습니다.

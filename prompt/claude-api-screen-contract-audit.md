# Claude 독립 작업: 화면-API 계약 대조

## 목표
현재 관리자 웹/회원 앱 화면이 호출하는 API와 `docs/API_SPEC.md`, `docs/SCREEN_SPEC.md`의 계약이 어긋나지 않는지 점검한다.

## 작업 범위
- `apps/admin-web/app`
- `apps/mobile-app/lib`
- `apps/api/src/app.controller.ts`
- `docs/API_SPEC.md`
- `docs/SCREEN_SPEC.md`

## 지시
1. 코드에서 실제 사용 중인 API 경로를 목록화한다.
2. `docs/API_SPEC.md`와 `docs/SCREEN_SPEC.md`에 해당 경로가 있는지 확인한다.
3. 문서에 없는 실제 구현 API가 있으면 문서를 보강한다.
4. 문서에는 있으나 현재 MVP 구현에서 제외된 API는 “추후 구현” 또는 “MVP 제외”로 명확히 표시한다.
5. 코드 변경은 하지 말고 문서만 수정한다.

## 특히 확인할 항목
- `POST /me/devices`
- `POST /clubs/:clubId/members/imports`
- `PATCH /clubs/:clubId/invite-links/:inviteId/disable`
- `POST /clubs/:clubId/invite-links/:token/accept`
- 회원 앱 `member-app` overview 응답 필드

## 완료 기준
- 실제 구현된 API와 문서 간 불일치가 정리되어 있다.
- 화면별 API 매핑이 현재 MVP 코드 기준으로 읽힌다.
- 완료 후 이 prompt 파일은 삭제한다.

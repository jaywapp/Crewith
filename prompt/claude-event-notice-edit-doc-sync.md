# Claude 독립 작업: 일정/공지 수정·삭제 문서 동기화

완료 후 이 파일은 삭제해 주세요.

## 목표

관리자 웹과 API에 일정/공지 수정·삭제가 구현되었으므로, 문서에서 `추후 구현`으로 남아 있는 관련 항목을 현재 코드 상태에 맞게 정리한다.

## 확인할 구현 상태

- 일정 API:
  - `PATCH /api/v1/clubs/:clubId/events/:eventId`
  - `DELETE /api/v1/clubs/:clubId/events/:eventId`
- 공지 API:
  - `PATCH /api/v1/clubs/:clubId/notices/:noticeId`
  - `DELETE /api/v1/clubs/:clubId/notices/:noticeId`
- 관리자 웹:
  - `apps/admin-web/app/events/page.tsx`에서 일정 수정/삭제 가능
  - `apps/admin-web/app/notices/page.tsx`에서 공지 수정/삭제 가능
- 공유 타입:
  - `UpdateAdminEventInput`
  - `UpdateAdminNoticeInput`

## 작업 범위

다음 문서의 구현 현황, API 매핑, QA 항목을 최신화한다.

- `docs/API_SPEC.md`
- `docs/SCREEN_SPEC.md`
- `docs/QA_CHECKLIST.md`
- `docs/ADMIN_USER_FLOW.md`
- 필요하면 `docs/TASK_BREAKDOWN.md`, `docs/ROADMAP.md`도 함께 조정

## 주의사항

- 코드 수정은 하지 않는다.
- 네이버 지도, 알림 설정 자동 스케줄, Firebase 전환 등 아직 구현되지 않은 항목은 구현 완료로 표시하지 않는다.
- 일정/공지 수정·삭제만 구현 완료로 반영한다.
- 문서 변경 후 `rg -n "일정 수정|공지 수정|수정/삭제|추후 구현|PATCH /clubs/.*/events|DELETE /clubs/.*/notices" docs`로 남은 불일치를 확인한다.

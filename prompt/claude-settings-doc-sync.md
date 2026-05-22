# Claude 독립 작업: 설정/개인정보 공개 기능 문서 동기화

완료 후 이 파일은 삭제해 주세요.

## 목표

관리자 웹 설정 화면과 개인정보 공개 설정 API가 구현되었으므로, 문서에서 아직 `추후 구현`으로 남아 있는 항목을 현재 코드 상태와 맞게 정리한다.

## 확인할 구현 상태

- 관리자 웹 라우트: `apps/admin-web/app/settings/page.tsx`
- 관리자 공통 네비게이션/서버 액션: `apps/admin-web/app/admin.tsx`
- API:
  - `GET /api/v1/clubs/:clubId/privacy-settings`
  - `PUT /api/v1/clubs/:clubId/privacy-settings`
- 공유 타입:
  - `ClubPrivacySettingsItem`
  - `UpdateClubPrivacySettingsInput`

## 작업 범위

다음 문서에서 구현 현황 표기와 화면/API 매핑을 최신화한다.

- `docs/API_SPEC.md`
- `docs/SCREEN_SPEC.md`
- `docs/QA_CHECKLIST.md`
- `docs/ONBOARDING.md`
- 필요하면 `docs/ADMIN_USER_FLOW.md`, `docs/TASK_BREAKDOWN.md`도 함께 조정

## 주의사항

- 코드 수정은 하지 않는다.
- 네이버 지도, 알림 설정 자동 스케줄, Firebase 전환 등 아직 구현되지 않은 항목은 구현 완료처럼 쓰지 않는다.
- 개인정보 공개 설정 API와 설정 화면만 “구현됨”으로 정리한다.
- 문서 변경 후 `rg -n "privacy-settings|개인정보 공개 설정|/settings|추후 구현" docs`로 남은 불일치를 확인한다.

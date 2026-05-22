# Claude 독립 작업: 알림 설정 문서 동기화

완료 후 이 파일은 삭제해 주세요.

## 목표

모임별 알림 설정 API와 관리자 설정 화면이 구현되었으므로, 문서에서 `추후 구현`으로 남아 있는 알림 설정 항목을 현재 코드 상태에 맞게 정리한다.

## 확인할 구현 상태

- API:
  - `GET /api/v1/clubs/:clubId/notification-settings`
  - `PUT /api/v1/clubs/:clubId/notification-settings`
- 관리자 웹:
  - `apps/admin-web/app/settings/page.tsx`에서 회비/일정/공지 리마인더 사용 여부와 기준값 설정 가능
- 리마인더 대상 산정:
  - `buildReminderTargets`가 `ClubNotificationSettingsItem` 값을 반영
  - 비활성화된 리마인더 유형은 `/reminders` 대상 목록에 표시되지 않음
- 공유 타입:
  - `ClubNotificationSettingsItem`
  - `UpdateClubNotificationSettingsInput`

## 작업 범위

다음 문서의 구현 현황, API 매핑, QA 항목을 최신화한다.

- `docs/API_SPEC.md`
- `docs/SCREEN_SPEC.md`
- `docs/QA_CHECKLIST.md`
- `docs/ADMIN_USER_FLOW.md`
- 필요하면 `docs/TASK_BREAKDOWN.md`, `docs/ROADMAP.md`도 함께 조정

## 주의사항

- 코드 수정은 하지 않는다.
- 실제 자동 스케줄러/FCM 실발송은 아직 구현 완료로 표시하지 않는다.
- 현재 구현은 설정 저장과 리마인더 대상 산정 반영, 수동 발송 로그 생성 범위다.
- 문서 변경 후 `rg -n "notification-settings|알림 설정|자동 발송|추후 구현" docs`로 남은 불일치를 확인한다.

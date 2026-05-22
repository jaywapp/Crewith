# Claude 독립 작업: 회원 앱 구성원 기능 문서 동기화

완료 후 이 파일은 삭제해 주세요.

## 목표

회원 앱 구성원 목록 API와 모바일 `구성원` 탭이 구현되었으므로, 문서에서 아직 `추후 구현`으로 남아 있는 구성원 관련 항목을 현재 코드 상태에 맞게 정리한다.

## 확인할 구현 상태

- API:
  - `GET /api/v1/clubs/:clubId/member-app/:memberId/members`
  - 일반 회원은 `club_privacy_settings` 공개 설정에 따라 전화번호/생년월일/성별 필드가 제한됨
  - 운영진/모임장은 전체 필드 조회 가능
- 모바일 앱:
  - `apps/mobile-app/lib/screens/members_page.dart`
  - 하단 탭 `구성원`
  - `MemberApiClient.fetchMemberDirectory`
- 공유 타입:
  - `MemberDirectoryItem`

## 작업 범위

다음 문서의 화면/API 매핑과 추후 구현 표기를 최신화한다.

- `docs/API_SPEC.md`
- `docs/SCREEN_SPEC.md`
- `docs/QA_CHECKLIST.md`
- `docs/MEMBER_APP_FLOW.md`
- 필요하면 `docs/ONBOARDING.md`, `docs/TASK_BREAKDOWN.md`도 함께 조정

## 주의사항

- 코드 수정은 하지 않는다.
- 네이버 지도, 알림 설정 자동 스케줄, Firebase 전환 등 아직 구현되지 않은 항목은 구현 완료로 표시하지 않는다.
- 구성원 목록은 관리자용 `GET /clubs/:clubId/members`와 회원 앱용 `GET /clubs/:clubId/member-app/:memberId/members`를 구분해서 문서화한다.
- 문서 변경 후 `rg -n "구성원|member-app/.*/members|추후 구현" docs`로 남은 불일치를 확인한다.

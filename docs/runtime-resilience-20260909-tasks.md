# 작업 계획

## 검증 결과 (2026-09-09)

- 비밀번호 비문자열 입력 방어, 회비 집계 세 번 filter를 한 번 순회로 개선했다.
- `apps/api/test/runtime-resilience.test.mjs`: 비밀번호·평문 이관·회비 상태·회원 순서·빈 값·없는 클럽 검증을 추가했다.
- 생성 필수 문자열 및 참석/출석 상태를 검증하고 입력 본문 없이 실패 단계를 기록한다. 제목 누락 500과 잘못된 참석 응답 200은 입력 오류 400으로 처리한다. 정상 제목·위치·본문 및 권한 검사 순서는 유지한다.
- `apps/api/test/input-validation.test.mjs` 추가 및 `endpoints.test.mjs` 입력 오류 회귀 검증을 확장했다.
- Prisma 타입 생성 후 API 빌드 및 최종 테스트 30개 통과. 부모 재실행도 통과했다. 실제 DB 대신 임시 JSON 저장소와 저장소 대역을 사용했다.
- 완료 표시는 확인된 변경과 회귀 범위에 한정한다. 실제 DB 및 전체 UI 입력 흐름은 미검증이다.

orchestrator: Codex

| 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|
| 소스 및 경계 조사 | Codex | gpt-6-astra | high | 없음 | web-repos | 소스·기존 테스트 | 기존 동작 근거 확인 | completed |
| 확인된 개선 및 회귀 테스트 | Codex | gpt-6-astra | high | 조사 | web-repos | 아래 기록 | 기존 및 새 테스트 실행 | completed |
| 전체 기능 통합 검증 | Codex | gpt-6-astra | high | 확인된 개선 및 회귀 테스트 | web-repos | 저장소 전체 | 실제 DB·브라우저 검증 미실행 | not_completed |

저장소 간 작업은 루트의 Codex 에이전트와 병렬 수행한다. 이 담당 그룹은 추가 슬롯이 없어 순차 처리하며 같은 소스의 구현과 회귀 검증도 의존성이 있어 순차 진행한다.

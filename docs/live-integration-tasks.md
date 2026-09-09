# 운영 연결 검증 작업

orchestrator: Codex

| 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|
| 운영 실패 원인 확인 | Codex | gpt-6-astra | high | 없음 | root-live | docs | HTTP·Vercel 로그·Supabase 상태 | complete |
| 기존 DB 재개·실제 HTTP 검증 | Codex | gpt-6-astra | high | 원인 확인 | root-live | docs | ACTIVE_HEALTHY·실제 SQL 성공, API DB 인증 오류 지속 | blocked |
| 결과·한계 기록 | Codex | gpt-6-astra | high | 검증 | root-live | docs | 비밀정보 제외·diff 검사 | complete |

복원 후 HTTP 검증은 의존성이 있어 순차 수행한다. 다른 저장소 작업은 별도 Codex 에이전트가 담당한다.

## 결과

Supabase는 ACTIVE_HEALTHY로 재개됐고 BEGIN READ ONLY에서 연결 및 public 기본 테이블 22개를 확인했다. 운영 데이터와 스키마는 변경하지 않았다.

재개 전 tenant/user not found 오류는 해소됐으나 Vercel API가 DB 자격증명 불일치로 503을 반환한다. 기존 production DATABASE_URL/DIRECT_URL은 sensitive 설정이며 최근 배포 전 생성된 값이다. 유효한 연결 비밀번호가 제공되거나 기존 비밀 저장소에서 확인돼야 환경 동기화가 가능하다. 임의 비밀번호 재설정이나 새 시크릿 발급은 하지 않았다. 로그인 전체 검증은 완료하지 못했다.

KeyMan 메타데이터에는 Supabase/Production의 Crewith Database Password가 있다. 공식 copy 도구는 성공했으나 실행 프로세스에서 클립보드는 비어 있어 메모리 기반 인증 검증은 자격증명 사용 전에 중단됐다. 값을 추출·출력하거나 다른 자격증명 저장소를 우회하지 않았다. 동일한 로컬 사용자 세션에서 해당 비밀을 안전하게 Vercel production 연결 설정에 동기화하는 단계가 남아 있다.

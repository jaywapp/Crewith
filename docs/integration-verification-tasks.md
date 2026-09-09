# 웹·API 통합 검증 작업

orchestrator: Codex

| 작업 | owner | model | effort | depends_on | parallel_group | files | verification | status |
|---|---|---|---|---|---|---|---|---|
| 규칙·기존 검증 조사 | Codex | gpt-6-astra | high | 없음 | crewith | 규칙·README·소스 | 저장소 상태 및 구조 | completed |
| 전체 빌드·타입 검사 | Codex | gpt-6-astra | high | 조사 | crewith | 기존 프로젝트 | npm build/typecheck | completed |
| HTTP 통합·회귀 보강 | Codex | gpt-6-astra | high | 빌드 | crewith | apps/api/test, app.controller.ts | 실제 HTTP fixture | completed |
| 브라우저 흐름·결과 문서 | Codex | gpt-6-astra | high | HTTP 검사 | crewith | docs, 테스트 harness | 로컬 화면·API 연결 | completed |

공유 빌드 산출물과 서버 상태의 의존성 때문에 저장소 내부 작업은 순차 수행한다. 루트 Codex가 다른 저장소를 병렬 조정한다. 추가 하위 위임 없음.

## 결과 (2026-09-09)

- `npm run build`: API, 관리자 웹 Next.js 15.5.20, shared-types 모두 성공. 16개 페이지 생성. Sentry global-error 파일 부재의 기존 권고 경고만 기록했다. Sentry DSN과 업로드 토큰은 빈 값으로 설정하고 telemetry를 비활성화했다.
- `npm run typecheck`: 전체 워크스페이스 통과.
- `npm run test -w @crewith/api`: API 재빌드 및 41개 검사 통과(기존 30개 + 새 통합 묶음 11개 집계).
- 새 HTTP 검사에서 권한 없는 외부인의 비밀번호 초기화가 기대 403 대신 200으로 성공하는 결함을 먼저 재현했다. 공통 컨트롤러의 소속 확인 이후 403 및 저장소 무변경, 같은 모임 정상 초기화·로그인까지 통과했다.
- `git diff --check`: 통과.

## 브라우저 실제 실행

Chrome의 새 검증 탭으로 production build 관리자 웹과 임시 JSON API를 연결했다. 실제 사용자 파일·계정·DB는 사용하지 않았다.

| 흐름 | 결과 |
|---|---|
| 비로그인 루트 접근 | 로그인 화면으로 이동 |
| 잘못된 fixture 비밀번호 | 전화번호 또는 비밀번호 확인 안내 |
| 모임장 로그인 | 통합 검증 모임, 회원 3명 대시보드 |
| 빈 공지 제목 제출 | 브라우저 required 검증으로 차단 |
| 공지 작성 및 제목 수정 | 목록과 실제 입력 값에 반영 |
| 로그아웃 | 로그인 화면으로 이동 |
| 일반회원 로그인 | 기존 관리자 모임 대신 모임 만들기 화면으로 이동 |
| 운영진 로그인 | 통합 검증 모임 대시보드 접근 |
| fixture API 중단 후 로그인 | 서버 연결 실패 안내 |
| 브라우저 경고·오류 로그 | 검사한 흐름에서 0건 |

API의 owner/operator/member/외부인 조회·생성·수정 권한, 자기 계정 조회·공지 읽음, 누락/잘못된/만료 JWT, 빈 컬렉션, 잘못된 입력과 영속 데이터 무변경도 실제 HTTP로 확인했다.

실행 주의: API 재빌드와 fixture 서버 시작이 한 번 겹쳐 dist 모듈을 찾지 못했다. 재빌드 완료 후 재시작하여 성공했다. 서버 시작은 반드시 빌드가 끝난 다음 진행해야 한다. 실패한 시작에서도 임시 폴더를 정리하도록 harness의 import를 try 범위에 포함했다.

브라우저 API 프로세스 49596 및 웹 프로세스 11580을 종료했고 해당 임시 디렉터리 두 개와 검증 탭을 정리했다. commit/push/배포 없음.

## 재현

```powershell
npm run build
npm run typecheck
npm run test -w @crewith/api
# 빌드가 모두 끝난 후 별도 로컬 터미널에서 실행한다.
node apps/api/test/browser-fixture.mjs
```

다른 터미널에서 관리자 웹을 실행한다. fixture 계정은 harness 안의 테스트 전용 값이며 실제 계정과 무관하다.

```powershell
$env:API_BASE_URL='http://127.0.0.1:4310/api/v1'
$env:NEXT_TELEMETRY_DISABLED='1'
$env:SENTRY_DSN=''
$env:NEXT_PUBLIC_SENTRY_DSN=''
$env:SENTRY_AUTH_TOKEN=''
npm run start -w @crewith/admin-web -- -H 127.0.0.1 -p 4311
```

브라우저 URL은 `http://localhost:4311`이다. fixture 터미널에 `stop`을 입력하면 서버와 임시 JSON 폴더를 정리한다. 관리자 웹도 종료한다. API의 일반 start 명령은 Prisma migration을 포함하므로 이 검증에 사용하지 않는다.

## 한계

실제 Prisma/PostgreSQL, Flutter 모바일 앱, 실서비스 외부 연동, 전 화면·전 입력 조합은 검증하지 않았다. 실제 DB 대신 저장소 대체를 사용하는 HTTP 통합이며 생산 DB 동작을 검증했다고 주장하지 않는다. 브라우저 모바일 뷰포트/시각 회귀 전체와 모든 서버 action 실패 UI도 범위 밖이다. 교차 모임 비밀번호 초기화 이외의 인증 정책은 변경하지 않았다.

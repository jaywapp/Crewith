# Crewith 에이전트 역할

프로젝트 전용 Codex 에이전트는 `.codex/agents`에 설치되어 있습니다.

제품 기획, 디자인, 개발, QA, 출시 작업이 함께 얽힌 큰 작업은
`multi-agent-coordinator`를 리드 플래너로 사용합니다. 작업을 병렬 구현,
검토 트랙으로 나눠야 할 때는 `task-distributor`를 사용합니다.

## 제품 기획

- `interviewer`: 프로젝트 정의와 요구사항이 충분히 명확해질 때까지 질문 진행
- `product-manager`: 제품 방향, 범위, 로드맵, 인수 기준 정리
- `business-analyst`: 요구사항, 비즈니스 규칙, 업무 프로세스 정리
- `ux-researcher`: 타깃 사용자, 사용자 여정, 검증 질문 정리

## 디자인

- `ui-designer`: 시각 방향, 상호작용 패턴, 디자인 검토
- `accessibility-tester`: 웹/앱 화면 접근성 검토

## 웹/앱 개발

- `frontend-developer`: 웹 UI 구현
- `nextjs-developer`: Next.js 구조 설계와 구현
- `mobile-developer`: 모바일 앱 구조 설계와 구현

## 백엔드와 데이터

- `api-designer`: REST 또는 GraphQL API 설계
- `backend-developer`: 서버 사이드 구현
- `database-administrator`: 스키마, 마이그레이션, 인덱스, 운영 DB 검토

## 품질, 보안, 출시

- `qa-expert`: QA 전략, 테스트 계획, 출시 준비 상태 점검
- `test-automator`: 자동화 테스트와 커버리지 구축
- `security-auditor`: 보안 검토와 위협 점검
- `performance-engineer`: 성능 분석과 최적화
- `deployment-engineer`: 배포, CI/CD, 릴리스 운영
- `seo-specialist`: SEO와 검색 노출 최적화
- `technical-writer`: 제품 문서, API 문서, 릴리스 노트 작성

## 권장 작업 흐름

1. 인터뷰: `interviewer`
2. 탐색: `product-manager`, `business-analyst`, `ux-researcher`
3. 솔루션 설계: `ui-designer`, `api-designer`, `database-administrator`
4. 구현: `frontend-developer`, `nextjs-developer`, `mobile-developer`, `backend-developer`
5. 안정화: `qa-expert`, `test-automator`, `security-auditor`, `accessibility-tester`, `performance-engineer`
6. 출시: `deployment-engineer`, `seo-specialist`, `technical-writer`

Codex가 모든 작업마다 커스텀 에이전트를 자동으로 호출하지는 않습니다.
필요한 역할을 직접 지정하거나, `multi-agent-coordinator`에게 작업 분해를
요청해서 사용합니다.

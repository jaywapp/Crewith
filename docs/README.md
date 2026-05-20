# Crewith 문서

Crewith 웹/앱 솔루션의 기획, 요구사항, 디자인, 개발 산출물을 관리하는 문서 폴더입니다.

## 문서 목록

- [프로젝트 브리프](PROJECT_BRIEF.md): 서비스 정의, 사용자, 해결 문제, 핵심 가치
- [요구사항 정의서](REQUIREMENTS.md): 제품 가정, 사용자, MVP 기능 요구사항, 비기능 요구사항, 확인 질문
- [MVP 범위표](MVP_SCOPE.md): MVP 필수/단순 구현/제외/추후 확장 범위
- [데이터 모델 초안](DATA_MODEL.md): PostgreSQL 기준 핵심 엔티티, 관계, 인덱스 후보
- [API 명세 초안](API_SPEC.md): REST API 그룹, 요청/응답 예시, 권한 규칙
- [UI 구조 초안](UI_ARCHITECTURE.md): DESIGN.md 기반 IA, 화면 목록, 컴포넌트 방향
- [화면 설계 초안](SCREEN_SPEC.md): 관리자 웹, 회원 앱, 운영진 앱 모드 화면 구성
- [기술 스택](TECH_STACK.md): 권장 기술, 배포, 인프라, 환경 변수
- [디자인 토큰](DESIGN_TOKENS.md): 색상, 타이포그래피, CSS 변수, Flutter Theme 초안
- [사용자 흐름](USER_FLOWS.md): 핵심 사용자 흐름과 QA 기준 흐름
- [개발 태스크 분해](TASK_BREAKDOWN.md): MVP 개발 단계와 역할별 작업
- [로드맵](ROADMAP.md): MVP 단계, Beta 확장, 성공 지표, 리스크

## 진행 순서

1. `interviewer`로 프로젝트 정체성, 사용자, 핵심 문제, MVP 범위를 먼저 확정합니다.
2. `product-manager`와 `business-analyst`로 범위와 요구사항을 정리합니다.
3. `api-designer`와 `database-administrator`로 API/DB 설계를 구체화합니다.
4. `ui-designer`, `nextjs-developer`, `mobile-developer`, `backend-developer`로 설계와 구현을 진행합니다.

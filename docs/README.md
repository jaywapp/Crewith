# Crewith 문서

Crewith 웹/앱 솔루션의 기획, 요구사항, 디자인, 개발 산출물을 관리하는 문서 폴더입니다.

## 문서 목록

### 기획·요구사항

- [프로젝트 브리프](PROJECT_BRIEF.md): 서비스 정의, 사용자, 해결 문제, 핵심 가치
- [요구사항 정의서](REQUIREMENTS.md): 제품 가정, 사용자, MVP 기능 요구사항, 비기능 요구사항, 확인 질문
- [MVP 범위표](MVP_SCOPE.md): MVP 필수/단순 구현/제외/추후 확장 범위
- [로드맵](ROADMAP.md): MVP 단계, Beta 확장, 성공 지표, 리스크
- [개발 태스크 분해](TASK_BREAKDOWN.md): MVP 개발 단계와 역할별 작업

### 설계·아키텍처

- [데이터 모델 초안](DATA_MODEL.md): PostgreSQL 기준 핵심 엔티티, 관계, 인덱스 후보
- [API 명세 초안](API_SPEC.md): REST API 그룹, 요청/응답 예시, 권한 규칙, 화면별 API 매핑
- [UI 구조 초안](UI_ARCHITECTURE.md): DESIGN.md 기반 IA, 화면 목록, 컴포넌트 방향
- [화면 설계 초안](SCREEN_SPEC.md): 관리자 웹, 회원 앱, 운영진 앱 모드 화면 구성 및 API 매핑
- [기술 스택](TECH_STACK.md): 권장 기술, 배포, 인프라, 환경 변수
- [디자인 토큰](DESIGN_TOKENS.md): 색상, 타이포그래피, CSS 변수, Flutter Theme 초안
- [Firebase 아키텍처](FIREBASE_ARCHITECTURE.md): Firestore 컬렉션 구조, Auth 설계, FCM 정책, Security Rules 링크
- [Firebase Security Rules 초안](FIREBASE_SECURITY_RULES_DRAFT.md): Firestore 보안 규칙 코드, 역할별 접근 제어, 테스트 시나리오
- [배포 계획](DEPLOYMENT_PLAN.md): 환경별 배포 전략 및 절차

### 사용자 흐름

- [사용자 흐름 (공통)](USER_FLOWS.md): 핵심 사용자 흐름과 QA 기준 흐름
- [관리자 웹 사용 흐름](ADMIN_USER_FLOW.md): 관리자 웹 16개 플로우, 실행 단계, 관련 QA 항목
- [회원 앱 사용 흐름](MEMBER_APP_FLOW.md): 회원 앱 12개 플로우, 실행 단계, 관련 QA 항목

### 품질·릴리즈

- [QA 체크리스트](QA_CHECKLIST.md): 관리자 웹/회원 앱/API/권한/개인정보/알림/릴리즈 게이트 체크 항목
- [MVP 릴리즈 체크리스트](MVP_RELEASE_CHECKLIST.md): 출시 전 확인 항목 및 완료 기준

### 법무·개인정보

- [이용약관 초안](TERMS_DRAFT.md): 서비스 이용 조건, 모임 운영 규칙, 회비/알림/면책 조항 (법률 검토 필요)
- [개인정보 처리방침 초안](PRIVACY_POLICY_DRAFT.md): 수집 항목, 이용 목적, 보유 기간, 제3자 제공, 위탁 업체 (법률 검토 필요)
- [법무 검토 TODO](LEGAL_REVIEW_TODO.md): 출시 전 법률 검토 체크리스트, 개인정보보호법 요구사항

### 온보딩·데모

- [온보딩 가이드](ONBOARDING.md): 프로젝트 구조, 기술 스택, 로컬 실행 방법, 현재 구현 상태, FAQ
- [데모 시나리오](DEMO_SCENARIO.md): 12단계 데모 스크립트, 데모 계정 정보, 예상 질문 대응

## 진행 순서

1. `interviewer`로 프로젝트 정체성, 사용자, 핵심 문제, MVP 범위를 먼저 확정합니다.
2. `product-manager`와 `business-analyst`로 범위와 요구사항을 정리합니다.
3. `api-designer`와 `database-administrator`로 API/DB 설계를 구체화합니다.
4. `ui-designer`, `nextjs-developer`, `mobile-developer`, `backend-developer`로 설계와 구현을 진행합니다.

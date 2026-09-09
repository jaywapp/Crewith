# 웹·API 통합 검증 설계

API의 기존 실제 AppModule/컨트롤러/가드를 사용하고 데이터 계층만 JsonMvpRepository로 대체한다. production main.ts와 동일한 글로벌 prefix·ValidationPipe·CORS 설정을 적용하고 loopback의 임시 포트에서 실행한다. 무작위 JWT 키와 별도 JSON 저장소로 다른 실행 및 실제 사용자 상태와 격리한다.

owner/operator/member/외부인 fixture의 HTTP 로그인 이후 정상 조회·생성·수정, 교차 클럽 접근, 누락/위조/만료 JWT, 잘못된 입력 및 저장소 무변경을 확인한다. 테스트 종료 시 서버와 임시 폴더를 정리한다. 브라우저 검증은 별도 fixture API와 관리자 웹 로컬 서버를 연결한다. Sentry 전송 및 telemetry를 비활성화한다.

실제 Prisma DB 연결 및 스키마 변경은 수행하지 않는다. 재현된 결함만 정상 계약을 보존하는 최소 범위에서 수정한다.

비밀번호 초기화에 clubId 매개변수를 바인딩하고 repository.getClubRole(clubId, memberId)를 await하여 대상 소속이 없으면 쓰기 전에 403을 반환한다. 저장소 resetMemberPassword 반환도 await하여 Prisma 비동기 반환이 응답 data에 빈 객체로 직렬화되지 않게 한다. 기존 호출자 운영진 가드와 같은 모임 정상 흐름은 보존한다.

# Crewith 화면 설계 초안

## 1. 목적

이 문서는 `UI_ARCHITECTURE.md`를 기준으로 관리자 웹과 회원 앱의 주요 화면 구성을 정의한다. 실제 시각 디자인 전 단계의 와이어프레임 명세로 사용한다.

## 2. 관리자 웹

### 2.1 대시보드

목적: 운영진이 모임의 현재 상태와 필요한 작업을 한 화면에서 파악한다.

구성:

- 상단 헤더
  - 모임명
  - 역할 배지
  - 무료 체험/구독 상태
  - 주요 액션: 공지 작성, 일정 생성
- 핵심 지표
  - 전체 회원 수
  - 활성 회원 수
  - 회비 미납자 수
  - 실제 출석률
  - 참석 의사 대비 출석률
  - 공지 확인률
  - 월별 회비 수납률
- 작업 큐
  - 대기 중 가입 신청
  - 회비 미납자
  - 오늘/다가오는 일정
  - 리마인드 필요한 공지
- 최근 활동
  - 최근 공지
  - 최근 일정
  - 최근 회비 항목

주요 액션:

- `일정 생성`
- `공지 작성`
- `회원 추가`
- `회비 확인`

### 2.2 회원 목록

목적: 운영진이 구성원 상태와 권한을 빠르게 확인하고 관리한다.

구성:

- 상단 툴바
  - 검색
  - 상태 필터: 전체, 활동 중, 휴면, 탈퇴, 강퇴
  - 역할 필터: 전체, 모임장, 운영진, 일반회원
  - 액션: Excel 업로드, 회원 추가
- 회원 테이블
  - 프로필
  - 이름
  - 연락처
  - 성별
  - 생년월일
  - 등급
  - 역할
  - 상태
  - 최근 참석/회비 요약
  - 더보기 액션
- 우측 상세 패널
  - 기본 정보
  - 회비 요약
  - 참석 요약
  - 상태 변경

### 2.3 Excel 업로드

목적: 기존 명부를 빠르게 가져온다.

구성:

- 업로드 카드
  - 파일 선택
  - 지원 형식 안내
  - 필수 컬럼 안내
- 업로드 결과
  - 등록 성공 수
  - 실패 수
  - 오류 행 목록

동작:

- 파일 업로드 후 즉시 등록한다.
- 오류가 있는 행은 등록 실패로 표시한다.
- 정상 행은 등록한다.

### 2.4 회비 현황

목적: 운영진이 납부 상태와 미납자를 관리한다.

구성:

- 상단 요약
  - 이번 달 수납률
  - 미납자 수
  - 총 부과액
  - 납부 완료액
- 필터
  - 기간
  - 회비 항목
  - 상태: 전체, 납부, 미납, 면제
- 납부 테이블
  - 회원
  - 항목
  - 금액
  - 납부 상태
  - 납부일
  - 토글
- 액션
  - 일회성 비용 생성
  - 미납 알림 보내기
  - 월회비 설정

### 2.5 월회비 설정

목적: 정기 회비 생성 규칙을 설정한다.

입력:

- 금액
- 납부일
- 납부 간격: 주간, 격주, 월간, 분기, 연간, 사용자 지정
- 사용자 지정 간격 일수
- 미납 유예기간
- 미납 알림 자동 발송 여부
- 미납 알림 발송 시점

### 2.6 일회성 비용 생성

목적: 대관비, 유니폼비, 행사비 등 특정 비용을 부과한다.

입력:

- 항목명
- 금액
- 납부일
- 부과 대상
  - 전체 회원
  - 특정 회원 수동 선택

제외:

- 일정 참석자 자동 부과

### 2.7 일정 목록

목적: 운영진이 일정과 참석 상태를 관리한다.

구성:

- 기간 필터
- 보기 권한 필터: 전체 회원, 운영진만
- 일정 리스트
  - 제목
  - 일시
  - 장소
  - 참석/불참 요약
  - 출석부 상태
  - 보기 권한

### 2.8 일정 생성/수정

입력:

- 제목
- 설명
- 시작/종료 일시
- 참석 응답 마감
- 보기 권한: 전체 회원, 운영진만
- 장소
  - 네이버 지도 검색
  - 장소명
  - 주소
  - 지도 좌표

### 2.9 출석부

목적: 운영진이 실제 참석 상태를 기록한다.

구성:

- 일정 정보
- 사전 참석 의사 요약
- 회원별 출석 리스트
  - 이름
  - 사전 응답
  - 실제 출석 상태: 참석, 지각, 결석
  - 동반 인원
- 하단 고정 저장 버튼

### 2.10 공지 목록

구성:

- 검색
- 보기 권한 필터
- 공지 리스트
  - 제목
  - 작성일
  - 보기 권한
  - 확인률
  - 댓글 수
  - 좋아요 수

### 2.11 공지 작성/수정

입력:

- 제목
- 본문
- 보기 권한: 전체 회원, 운영진만

동작:

- 작성 후 대상 회원에게 푸시 알림을 보낸다.
- 운영진 전용 공지는 일반 회원에게 노출하지 않는다.

### 2.12 공지 확인 현황

구성:

- 확인률
- 확인 회원 목록
- 미확인 회원 목록
- 리마인드 발송 액션

### 2.13 가입 신청

구성:

- 신청자 목록
  - 이름
  - 연락처
  - 가입 인사
  - 신청일
- 상세 패널
- 승인/거절 버튼

동작:

- 승인 시 모임 회원으로 등록한다.
- 승인/거절 결과를 앱 푸시로 보낸다.

### 2.14 초대 링크 관리

구성:

- 새 초대 링크 생성
- 만료 기간 설정
- 기존 링크 목록
- 비활성화 액션

### 2.15 설정

탭:

- 모임 기본 정보
- 개인정보 공개 설정
- 권한 관리
- 알림 설정
- 구독 상태

## 3. 회원 앱

### 3.1 로그인

구성:

- 휴대폰 번호 입력
- 인증번호 입력
- 재전송
- 인증 완료

### 3.2 프로필 입력

입력:

- 이름
- 생년월일
- 성별
- 프로필 사진

### 3.3 모임 선택

구성:

- 가입한 모임 목록
- 역할 표시
- 현재 모임 진입
- 초대 링크로 가입 진입

### 3.4 홈

구성:

- 현재 모임 헤더
- 다음 일정 카드
- 내 회비 상태
- 미확인 공지
- 최근 알림
- 운영진인 경우 운영 모드 진입

### 3.5 일정 목록

구성:

- 월/다가오는 일정 리스트
- 참석 상태 칩
- 응답 마감 표시

### 3.6 일정 상세

구성:

- 제목
- 일시
- 네이버 지도 장소 카드
- 설명
- 참석/불참 segmented control
- 응답 마감 안내
- 운영진인 경우 출석부 버튼

### 3.7 공지 목록

구성:

- 미확인 공지 우선 표시
- 공지 제목
- 작성일
- 확인 여부
- 댓글/좋아요 수

### 3.8 공지 상세

구성:

- 제목
- 본문
- 작성자/작성일
- 좋아요
- 댓글

동작:

- 상세 진입 시 자동 확인 처리한다.

### 3.9 내 회비

구성:

- 납부 상태 요약
- 미납 항목
- 납부 완료 항목
- 면제 항목

제외:

- 앱 내 결제

### 3.10 구성원

구성:

- 회원 목록
- 공개 설정에 따른 필드 노출
- 회원 상세

### 3.11 알림

구성:

- 공지 알림
- 일정 알림
- 회비 알림
- 가입 승인/거절 알림

## 4. 운영진 앱 모드

### 4.1 운영 홈

구성:

- 오늘 일정
- 출석부 바로가기
- 미납자 수
- 가입 신청 수
- 미확인 공지 리마인드 대상

### 4.2 모바일 회비 체크

구성:

- 회비 항목 선택
- 회원별 납부 상태
- 납부 토글
- 납부일 수정

### 4.3 모바일 출석부

구성:

- 사전 참석 의사
- 실제 출석 상태 선택
- 동반 인원 stepper
- 저장 버튼

### 4.4 모바일 공지 작성

구성:

- 제목
- 본문
- 보기 권한
- 게시 버튼

### 4.5 모바일 가입 승인

구성:

- 가입 신청자 정보
- 가입 인사
- 승인/거절

## 5. 화면 우선순위

### P0

- 휴대폰 인증
- 프로필 입력
- 모임 생성/선택
- 관리자 대시보드
- 회원 목록/Excel 업로드
- 회비 현황/월회비 설정/납부 토글
- 일정 목록/일정 생성/출석부
- 공지 목록/공지 작성/공지 상세
- 앱 홈/일정/공지/내 회비

### P1

- 초대 링크 관리
- 가입 신청 승인
- 알림 설정
- 구독 상태
- 개인정보 공개 설정
- 통계 상세
- 운영진 앱 모드

### P2

- 고급 필터
- 세부 리포트
- 상세 활동 로그
- iOS 최적화 화면 점검

---

## 6. 화면별 API 매핑

> API 전체 목록과 세부 계약은 [API_SPEC.md §17 화면별 API 매핑](./API_SPEC.md)을 참조한다. 이 섹션은 각 화면이 어떤 API 호출에 의존하는지 요약한다.

> MVP 실제 구현 코드 기준 경로를 사용한다. "추후 구현" 표시는 MVP 코드에 없는 항목이다.
> 전체 불일치 요약은 [API_SPEC.md §17](./API_SPEC.md)을 참조한다.

### 6.1 관리자 웹

| 화면 | 초기 로드 API (MVP) | 주요 액션 API (MVP) |
|---|---|---|
| 2.1 대시보드 | `GET /clubs/{clubId}/admin/overview` | — |
| 2.2 회원 목록 | `GET /clubs/{clubId}/members` | `PATCH /clubs/{clubId}/members/{memberId}` |
| 2.3 Excel 업로드 | — | `POST /clubs/{clubId}/members/imports` |
| 2.4 회비 현황 | `GET /clubs/{clubId}/fees` | `PATCH /clubs/{clubId}/fees/{feeId}/payments` |
| 2.5 월회비 설정 | `GET /clubs/{clubId}/fee-settings` | `PUT /clubs/{clubId}/fee-settings` |
| 2.6 일회성 비용 생성 | — | `POST /clubs/{clubId}/fees` |
| 2.7 일정 목록 | `GET /clubs/{clubId}/events` | — |
| 2.8 일정 생성/수정/삭제 | `GET /clubs/{clubId}/events` | `POST /clubs/{clubId}/events`, `PATCH .../events/{eventId}`, `DELETE .../events/{eventId}` |
| 2.9 출석부 | — (추후 구현) | `PATCH /clubs/{clubId}/events/{eventId}/attendance` |
| 2.10 공지 목록 | `GET /clubs/{clubId}/notices` | — |
| 2.11 공지 작성/수정/삭제 | `GET /clubs/{clubId}/notices` | `POST /clubs/{clubId}/notices`, `PATCH .../notices/{noticeId}`, `DELETE .../notices/{noticeId}` |
| 2.12 공지 확인 현황 | — (추후 구현) | `PATCH .../read`, `POST /clubs/{clubId}/reminders/send` |
| 2.13 가입 신청 | `GET /clubs/{clubId}/join-requests` | `PATCH /clubs/{clubId}/join-requests/{requestId}` |
| 2.14 초대 링크 관리 | `GET /clubs/{clubId}/invite-links` | `POST /clubs/{clubId}/invite-links`, `PATCH .../disable` |
| 2.15 설정 | `GET /clubs/{clubId}/privacy-settings`, `GET /clubs/{clubId}/notification-settings` | `PUT /clubs/{clubId}/privacy-settings`, `PUT /clubs/{clubId}/notification-settings` |

### 6.2 회원 앱

| 화면 | 초기 로드 API (MVP) | 주요 액션 API (MVP) |
|---|---|---|
| 3.1 로그인 | — | `POST /auth/otp/request`, `POST /auth/otp/verify` |
| 3.2 프로필 입력 | `GET /members/{memberId}/profile` | `PATCH /members/{memberId}/profile` |
| 3.3 모임 선택 | — (추후 구현) | — |
| 3.4 홈 | `GET /clubs/{clubId}/member-app/{memberId}` | — |
| 3.5 일정 목록 | `GET /clubs/{clubId}/events` | — |
| 3.6 일정 상세 | — (목록 데이터 재사용) | `PATCH /clubs/{clubId}/events/{eventId}/responses` |
| 3.7 공지 목록 | `GET /clubs/{clubId}/notices` | — |
| 3.8 공지 상세 | — (목록 데이터 재사용) | `PATCH .../read`, `PATCH .../reactions`, `POST .../comments` |
| 3.9 내 회비 | — (member-app overview에 포함) | — |
| 3.10 구성원 | `GET /clubs/{clubId}/member-app/{memberId}/members` | — |
| 3.11 알림 | `GET /me/notifications` | `PATCH /me/notifications/{id}/read` |

### 6.3 운영진 앱 모드 (추후 구현)

| 화면 | 초기 로드 API | 주요 액션 API |
|---|---|---|
| 4.1 운영 홈 | `GET /clubs/{clubId}/admin/overview` | — |
| 4.2 모바일 회비 체크 | `GET /clubs/{clubId}/fees` | `PATCH /clubs/{clubId}/fees/{feeId}/payments` |
| 4.3 모바일 출석부 | — | `PATCH /clubs/{clubId}/events/{eventId}/attendance` |
| 4.4 모바일 공지 작성 | — | `POST /clubs/{clubId}/notices` |
| 4.5 모바일 가입 승인 | `GET /clubs/{clubId}/join-requests` | `PATCH /clubs/{clubId}/join-requests/{requestId}` |

### 6.4 API 의존성 규칙

- 모든 모임 리소스 API 경로는 `/clubs/{clubId}/` 로 시작하며, `clubId`가 없거나 접근 불가한 경우 `404 CLUB_NOT_FOUND` 또는 `403 NOT_CLUB_MEMBER` 를 반환한다.
- `operators_only` 리소스는 일반 `member` 역할에게 목록과 상세 모두 숨긴다.
- 역할/상태 변경은 단일 `PATCH /clubs/{clubId}/members/{memberId}` 엔드포인트로 처리한다.
- 리마인더 발송 API (`POST /clubs/{clubId}/reminders/send`)는 `operator` 이상 권한 필요.
- MVP 인증 방식: `x-crewith-role` 헤더 (Firebase Auth 연동 후 Bearer JWT 전환 예정).

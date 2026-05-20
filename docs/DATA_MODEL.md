# Crewith 데이터 모델 초안

## 1. 설계 기준

- 데이터베이스는 PostgreSQL을 기준으로 한다.
- 백엔드는 NestJS API 서버를 우선 고려한다.
- 사용자는 여러 모임에 가입할 수 있고, 모임마다 다른 권한을 가질 수 있다.
- MVP의 핵심 도메인은 사용자, 모임, 구성원, 회비, 일정, 공지, 알림이다.
- 실제 결제는 MVP에서 제외하되, 구독 상태와 무료 체험 정보는 저장한다.

## 2. 핵심 엔티티

### users

서비스 계정 단위 사용자.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 사용자 ID |
| phone_number | varchar | 휴대폰 번호 |
| name | varchar | 사용자 이름 |
| birth_date | date | 생년월일 |
| gender | varchar | 성별 |
| profile_image_url | text | 프로필 사진 URL |
| status | varchar | active, deleted |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### clubs

동호회/모임.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 모임 ID |
| name | varchar | 모임명 |
| sport_type | varchar | 스포츠 종목 |
| visibility | varchar | public, private |
| owner_user_id | uuid | 최초 모임장 |
| trial_started_at | timestamptz | 무료 체험 시작일 |
| trial_ends_at | timestamptz | 무료 체험 종료일 |
| subscription_tier | varchar | under_30, under_100, under_300 |
| subscription_status | varchar | trial, active, expired, suspended |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### club_members

사용자와 모임의 membership. 권한과 모임 내 상태는 여기서 관리한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 멤버십 ID |
| club_id | uuid | 모임 ID |
| user_id | uuid | 사용자 ID |
| role | varchar | owner, operator, member |
| member_status | varchar | active, dormant, left, removed |
| joined_at | timestamptz | 가입일 |
| left_at | timestamptz | 탈퇴/강퇴/휴면 처리일 |
| personal_data_delete_at | timestamptz | 개인정보 삭제 예정일 |
| grade | varchar | 등급 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### club_privacy_settings

모임별 회원 개인정보 공개 설정.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 설정 ID |
| club_id | uuid | 모임 ID |
| field_name | varchar | name, phone_number, birth_date, gender 등 |
| visible_to_members | boolean | 일반 회원에게 공개 여부 |
| visible_to_operators | boolean | 운영진에게 공개 여부 |
| updated_at | timestamptz | 수정일 |

## 3. 가입과 초대

### join_requests

공개 모임 가입 신청.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 가입 신청 ID |
| club_id | uuid | 모임 ID |
| user_id | uuid | 신청자 ID |
| applicant_name | varchar | 신청 시 입력한 이름 |
| applicant_phone | varchar | 신청 시 입력한 연락처 |
| greeting | text | 가입 인사 |
| status | varchar | pending, approved, rejected |
| reviewed_by | uuid | 처리한 운영진 ID |
| reviewed_at | timestamptz | 처리일 |
| created_at | timestamptz | 신청일 |

### invite_links

비공개 모임 초대 링크.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 초대 링크 ID |
| club_id | uuid | 모임 ID |
| token_hash | varchar | 초대 토큰 해시 |
| expires_at | timestamptz | 만료일 |
| created_by | uuid | 생성한 운영진 ID |
| disabled_at | timestamptz | 비활성화일 |
| created_at | timestamptz | 생성일 |

## 4. 회비

### club_fee_settings

모임별 월회비/정기 회비 설정.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 설정 ID |
| club_id | uuid | 모임 ID |
| amount | integer | 기본 회비 금액 |
| due_day | integer | 납부일 |
| interval_type | varchar | weekly, biweekly, monthly, quarterly, yearly, custom |
| custom_interval_days | integer | 사용자 지정 간격 |
| grace_period_days | integer | 미납 유예기간 |
| auto_reminder_enabled | boolean | 미납 알림 자동 발송 여부 |
| reminder_rule | jsonb | 미납 알림 발송 시점 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### fee_items

월회비 자동 생성분 또는 일회성 비용 항목.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 회비 항목 ID |
| club_id | uuid | 모임 ID |
| title | varchar | 항목명 |
| fee_type | varchar | recurring, one_time |
| amount | integer | 금액 |
| due_date | date | 납부일 |
| visibility | varchar | all_members, selected_members |
| created_by | uuid | 생성한 운영진 ID |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### fee_item_targets

특정 회원 대상 회비 부과.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 대상 ID |
| fee_item_id | uuid | 회비 항목 ID |
| club_member_id | uuid | 대상 멤버십 ID |

### fee_payments

회원별 회비 납부 상태.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 납부 상태 ID |
| fee_item_id | uuid | 회비 항목 ID |
| club_member_id | uuid | 멤버십 ID |
| status | varchar | unpaid, paid, exempt |
| paid_at | timestamptz | 납부일 |
| recorded_by | uuid | 토글 처리 운영진 ID |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

## 5. 일정과 출석

### events

일정.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 일정 ID |
| club_id | uuid | 모임 ID |
| title | varchar | 제목 |
| description | text | 설명 |
| starts_at | timestamptz | 시작일시 |
| ends_at | timestamptz | 종료일시 |
| visibility | varchar | all_members, operators_only |
| response_deadline | timestamptz | 참석 의사 응답 마감 |
| location_name | varchar | 장소명 |
| location_address | text | 주소 |
| naver_map_place_id | varchar | 네이버 지도 장소 ID |
| latitude | numeric | 위도 |
| longitude | numeric | 경도 |
| created_by | uuid | 생성한 운영진 ID |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### event_responses

사전 참석 의사.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 응답 ID |
| event_id | uuid | 일정 ID |
| club_member_id | uuid | 멤버십 ID |
| response | varchar | attending, not_attending |
| responded_at | timestamptz | 응답일 |

### event_attendance

실제 출석부.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 출석 ID |
| event_id | uuid | 일정 ID |
| club_member_id | uuid | 멤버십 ID |
| status | varchar | present, late, absent |
| companion_count | integer | 동반 인원 |
| checked_by | uuid | 체크한 운영진 ID |
| checked_at | timestamptz | 체크일 |

## 6. 공지

### notices

공지사항.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 공지 ID |
| club_id | uuid | 모임 ID |
| title | varchar | 제목 |
| body | text | 내용 |
| visibility | varchar | all_members, operators_only |
| created_by | uuid | 작성자 ID |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |
| deleted_at | timestamptz | 삭제일 |

### notice_reads

공지 열람/확인 기록.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 확인 ID |
| notice_id | uuid | 공지 ID |
| club_member_id | uuid | 멤버십 ID |
| read_at | timestamptz | 열람일 |

### notice_comments

공지 댓글.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 댓글 ID |
| notice_id | uuid | 공지 ID |
| club_member_id | uuid | 작성자 멤버십 ID |
| body | text | 댓글 내용 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |
| deleted_at | timestamptz | 삭제일 |

### notice_reactions

공지 좋아요/반응.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 반응 ID |
| notice_id | uuid | 공지 ID |
| club_member_id | uuid | 멤버십 ID |
| reaction_type | varchar | like |
| created_at | timestamptz | 생성일 |

## 7. 알림과 디바이스

### user_devices

앱 푸시 대상 디바이스.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 디바이스 ID |
| user_id | uuid | 사용자 ID |
| platform | varchar | android, ios |
| fcm_token | text | FCM 토큰 |
| last_seen_at | timestamptz | 마지막 접속 |
| created_at | timestamptz | 생성일 |

### notifications

발송 또는 예약된 알림.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 알림 ID |
| user_id | uuid | 수신자 ID |
| club_id | uuid | 모임 ID |
| type | varchar | notice, event, fee, join_request |
| title | varchar | 알림 제목 |
| body | text | 알림 내용 |
| deep_link | text | 이동 경로 |
| scheduled_at | timestamptz | 예약 발송일 |
| sent_at | timestamptz | 발송일 |
| read_at | timestamptz | 앱 내 확인일 |
| created_at | timestamptz | 생성일 |

### club_notification_settings

모임별 알림 설정.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 설정 ID |
| club_id | uuid | 모임 ID |
| event_reminder_rule | jsonb | 일정 알림 시점 |
| fee_reminder_rule | jsonb | 미납 알림 시점 |
| notice_unread_reminder_rule | jsonb | 공지 미확인 리마인드 조건 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

## 8. 파일

### files

프로필 사진 등 업로드 파일 메타데이터.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 파일 ID |
| owner_user_id | uuid | 소유 사용자 ID |
| club_id | uuid | 관련 모임 ID |
| file_type | varchar | profile_image |
| storage_key | text | R2/S3 객체 키 |
| public_url | text | 접근 URL |
| mime_type | varchar | MIME 타입 |
| size_bytes | integer | 파일 크기 |
| created_at | timestamptz | 생성일 |
| deleted_at | timestamptz | 삭제일 |

## 9. 주요 관계

- `users` 1:N `club_members`
- `clubs` 1:N `club_members`
- `clubs` 1:N `join_requests`
- `clubs` 1:N `invite_links`
- `clubs` 1:N `fee_items`
- `fee_items` 1:N `fee_payments`
- `clubs` 1:N `events`
- `events` 1:N `event_responses`
- `events` 1:N `event_attendance`
- `clubs` 1:N `notices`
- `notices` 1:N `notice_reads`
- `notices` 1:N `notice_comments`
- `users` 1:N `user_devices`

## 10. 인덱스 후보

- `users.phone_number` unique
- `club_members (club_id, user_id)` unique
- `club_members (club_id, role)`
- `club_members (club_id, member_status)`
- `join_requests (club_id, status, created_at)`
- `invite_links.token_hash` unique
- `fee_items (club_id, due_date)`
- `fee_payments (fee_item_id, club_member_id)` unique
- `fee_payments (club_member_id, status)`
- `events (club_id, starts_at)`
- `event_responses (event_id, club_member_id)` unique
- `event_attendance (event_id, club_member_id)` unique
- `notices (club_id, created_at)`
- `notice_reads (notice_id, club_member_id)` unique
- `user_devices (user_id, platform)`
- `notifications (user_id, sent_at)`

## 11. 설계 메모

- 권한 판단은 `club_members.role`을 기준으로 한다.
- 운영진 전용 공지/일정은 쿼리 단계에서 일반 회원에게 노출하지 않는다.
- 회원 개인정보 삭제 시 `users`의 전역 계정 정보와 `club_members`의 모임별 정보를 분리해서 처리해야 한다.
- 탈퇴/강퇴/휴면 후 30일이 지나면 개인정보는 삭제하되, `fee_payments`, `event_attendance` 같은 운영 이력은 익명화된 멤버십 참조 또는 보존 정책을 정해야 한다.
- 월회비 자동 생성, 미납 판단, 알림 예약, 30일 후 개인정보 삭제는 백그라운드 작업으로 설계한다.

class AuthSession {
  const AuthSession({
    required this.memberId,
    required this.clubs,
  });

  final String memberId;
  final List<ClubSummary> clubs;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      memberId: json['memberId'] as String,
      clubs: (json['clubs'] as List<dynamic>? ?? [])
          .map((item) => ClubSummary.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ClubSummary {
  const ClubSummary({
    required this.clubId,
    required this.name,
    required this.sportType,
    required this.role,
    required this.memberStatus,
  });

  final String clubId;
  final String name;
  final String sportType;
  final String role;
  final String memberStatus;

  factory ClubSummary.fromJson(Map<String, dynamic> json) {
    return ClubSummary(
      clubId: json['clubId'] as String,
      name: json['name'] as String,
      sportType: json['sportType'] as String,
      role: json['role'] as String,
      memberStatus: json['memberStatus'] as String,
    );
  }
}

class MemberAppOverview {
  const MemberAppOverview({
    required this.clubName,
    required this.sportType,
    required this.memberName,
    required this.fees,
    required this.events,
    required this.notices,
  });

  final String clubName;
  final String sportType;
  final String memberName;
  final List<MemberFee> fees;
  final List<MemberEvent> events;
  final List<MemberNotice> notices;

  factory MemberAppOverview.fromJson(Map<String, dynamic> json) {
    final club = json['club'] as Map<String, dynamic>;
    final member = json['member'] as Map<String, dynamic>;

    return MemberAppOverview(
      clubName: club['name'] as String,
      sportType: club['sportType'] as String,
      memberName: member['name'] as String,
      fees: (json['fees'] as List<dynamic>)
          .map((item) => MemberFee.fromJson(item as Map<String, dynamic>))
          .toList(),
      events: (json['events'] as List<dynamic>)
          .map((item) => MemberEvent.fromJson(item as Map<String, dynamic>))
          .toList(),
      notices: (json['notices'] as List<dynamic>)
          .map((item) => MemberNotice.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  factory MemberAppOverview.seed() {
    return const MemberAppOverview(
      clubName: '서울 러너스',
      sportType: '러닝',
      memberName: '박도윤',
      fees: [
        MemberFee(
          id: 'fee-2026-05',
          title: '5월 월회비',
          amount: 30000,
          dueDate: '2026-05-25',
          status: 'unpaid',
        ),
        MemberFee(
          id: 'fee-event-01',
          title: '춘계 단체복 비용',
          amount: 45000,
          dueDate: '2026-05-30',
          status: 'unpaid',
        ),
      ],
      events: [
        MemberEvent(
          id: 'event-01',
          title: '목요 야간 러닝',
          startsAt: '2026-05-21T20:00:00+09:00',
          locationName: '여의도 한강공원',
          locationAddress: '서울 영등포구 여의동로 330',
          response: 'not_attending',
          attendanceStatus: 'absent',
          companionCount: 0,
        ),
      ],
      notices: [
        MemberNotice(
          id: 'notice-01',
          title: '5월 회비 납부 안내',
          body: '5월 월회비 납부일은 5월 25일입니다.',
          visibility: 'all_members',
          read: false,
          likeCount: 2,
          commentCount: 1,
        ),
      ],
    );
  }

  MemberAppOverview updateEventResponse(String eventId, String response) {
    return MemberAppOverview(
      clubName: clubName,
      sportType: sportType,
      memberName: memberName,
      fees: fees,
      events: events
          .map((event) =>
              event.id == eventId ? event.copyWith(response: response) : event)
          .toList(),
      notices: notices,
    );
  }

  MemberAppOverview markNoticeRead(String noticeId) {
    return MemberAppOverview(
      clubName: clubName,
      sportType: sportType,
      memberName: memberName,
      fees: fees,
      events: events,
      notices: notices
          .map((notice) =>
              notice.id == noticeId ? notice.copyWith(read: true) : notice)
          .toList(),
    );
  }

  MemberAppOverview updateMemberName(String name) {
    return MemberAppOverview(
      clubName: clubName,
      sportType: sportType,
      memberName: name,
      fees: fees,
      events: events,
      notices: notices,
    );
  }
}

class MemberFee {
  const MemberFee({
    required this.id,
    required this.title,
    required this.amount,
    required this.dueDate,
    required this.status,
  });

  final String id;
  final String title;
  final int amount;
  final String dueDate;
  final String status;

  factory MemberFee.fromJson(Map<String, dynamic> json) {
    return MemberFee(
      id: json['id'] as String,
      title: json['title'] as String,
      amount: json['amount'] as int,
      dueDate: json['dueDate'] as String,
      status: json['status'] as String,
    );
  }
}

class MemberEvent {
  const MemberEvent({
    required this.id,
    required this.title,
    required this.startsAt,
    required this.locationName,
    required this.locationAddress,
    required this.response,
    required this.attendanceStatus,
    required this.companionCount,
  });

  final String id;
  final String title;
  final String startsAt;
  final String locationName;
  final String? locationAddress;
  final String response;
  final String attendanceStatus;
  final int companionCount;

  factory MemberEvent.fromJson(Map<String, dynamic> json) {
    return MemberEvent(
      id: json['id'] as String,
      title: json['title'] as String,
      startsAt: json['startsAt'] as String,
      locationName: json['locationName'] as String,
      locationAddress: json['locationAddress'] as String?,
      response: json['response'] as String,
      attendanceStatus: json['attendanceStatus'] as String,
      companionCount: json['companionCount'] as int,
    );
  }

  MemberEvent copyWith({String? response}) {
    return MemberEvent(
      id: id,
      title: title,
      startsAt: startsAt,
      locationName: locationName,
      locationAddress: locationAddress,
      response: response ?? this.response,
      attendanceStatus: attendanceStatus,
      companionCount: companionCount,
    );
  }
}

class MemberNotice {
  const MemberNotice({
    required this.id,
    required this.title,
    required this.body,
    required this.visibility,
    required this.read,
    required this.likeCount,
    required this.commentCount,
  });

  final String id;
  final String title;
  final String body;
  final String visibility;
  final bool read;
  final int likeCount;
  final int commentCount;

  factory MemberNotice.fromJson(Map<String, dynamic> json) {
    return MemberNotice(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      visibility: json['visibility'] as String,
      read: json['read'] as bool,
      likeCount: json['likeCount'] as int,
      commentCount: json['commentCount'] as int,
    );
  }

  MemberNotice copyWith({bool? read}) {
    return MemberNotice(
      id: id,
      title: title,
      body: body,
      visibility: visibility,
      read: read ?? this.read,
      likeCount: likeCount,
      commentCount: commentCount,
    );
  }
}

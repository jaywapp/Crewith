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

class MemberDirectoryItem {
  const MemberDirectoryItem({
    required this.id,
    required this.name,
    required this.role,
    required this.memberStatus,
    required this.joinedAt,
    required this.profileImageUrl,
    required this.phoneNumber,
    required this.birthDate,
    required this.gender,
  });

  final String id;
  final String name;
  final String role;
  final String memberStatus;
  final String joinedAt;
  final String? profileImageUrl;
  final String? phoneNumber;
  final String? birthDate;
  final String? gender;

  factory MemberDirectoryItem.fromJson(Map<String, dynamic> json) {
    return MemberDirectoryItem(
      id: json['id'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      memberStatus: json['memberStatus'] as String,
      joinedAt: json['joinedAt'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      birthDate: json['birthDate'] as String?,
      gender: json['gender'] as String?,
    );
  }

  static const seedItems = [
    MemberDirectoryItem(
      id: 'member-01',
      name: '김민준',
      role: 'owner',
      memberStatus: 'active',
      joinedAt: '2025-11-02',
      profileImageUrl: null,
      phoneNumber: null,
      birthDate: null,
      gender: null,
    ),
    MemberDirectoryItem(
      id: 'member-02',
      name: '이서연',
      role: 'operator',
      memberStatus: 'active',
      joinedAt: '2025-12-14',
      profileImageUrl: null,
      phoneNumber: null,
      birthDate: null,
      gender: null,
    ),
    MemberDirectoryItem(
      id: 'member-03',
      name: '박도윤',
      role: 'member',
      memberStatus: 'active',
      joinedAt: '2026-01-06',
      profileImageUrl: null,
      phoneNumber: '010-1234-1003',
      birthDate: '1994-01-06',
      gender: 'male',
    ),
  ];
}

class MemberNotification {
  const MemberNotification({
    required this.id,
    required this.memberId,
    required this.clubId,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.readAt,
  });

  final String id;
  final String memberId;
  final String clubId;
  final String type;
  final String title;
  final String body;
  final String createdAt;
  final String? readAt;

  bool get read => readAt != null;

  factory MemberNotification.fromJson(Map<String, dynamic> json) {
    return MemberNotification(
      id: json['id'] as String,
      memberId: json['memberId'] as String,
      clubId: json['clubId'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      createdAt: json['createdAt'] as String,
      readAt: json['readAt'] as String?,
    );
  }

  MemberNotification markRead() {
    return MemberNotification(
      id: id,
      memberId: memberId,
      clubId: clubId,
      type: type,
      title: title,
      body: body,
      createdAt: createdAt,
      readAt: readAt ?? DateTime.now().toIso8601String(),
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
          liked: false,
          likeCount: 2,
          commentCount: 1,
          comments: [
            MemberNoticeComment(
              id: 'comment-01',
              memberName: '이서연',
              body: '입금 확인했습니다.',
              createdAt: '2026-05-18T10:20:00+09:00',
            ),
          ],
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
    return _updateNotice(noticeId, (notice) => notice.copyWith(read: true));
  }

  MemberAppOverview toggleNoticeReaction(String noticeId) {
    return _updateNotice(
      noticeId,
      (notice) => notice.copyWith(
        liked: !notice.liked,
        likeCount: notice.liked
            ? (notice.likeCount - 1).clamp(0, 9999)
            : notice.likeCount + 1,
      ),
    );
  }

  MemberAppOverview addNoticeComment(
    String noticeId,
    String memberName,
    String body,
  ) {
    return _updateNotice(
      noticeId,
      (notice) => notice.copyWith(
        commentCount: notice.commentCount + 1,
        comments: [
          ...notice.comments,
          MemberNoticeComment(
            id: 'local-${DateTime.now().millisecondsSinceEpoch}',
            memberName: memberName,
            body: body,
            createdAt: DateTime.now().toIso8601String(),
          ),
        ],
      ),
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

  MemberAppOverview _updateNotice(
    String noticeId,
    MemberNotice Function(MemberNotice notice) update,
  ) {
    return MemberAppOverview(
      clubName: clubName,
      sportType: sportType,
      memberName: memberName,
      fees: fees,
      events: events,
      notices: notices
          .map((notice) => notice.id == noticeId ? update(notice) : notice)
          .toList(),
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
    required this.liked,
    required this.likeCount,
    required this.commentCount,
    required this.comments,
  });

  final String id;
  final String title;
  final String body;
  final String visibility;
  final bool read;
  final bool liked;
  final int likeCount;
  final int commentCount;
  final List<MemberNoticeComment> comments;

  factory MemberNotice.fromJson(Map<String, dynamic> json) {
    return MemberNotice(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      visibility: json['visibility'] as String,
      read: json['read'] as bool,
      liked: json['liked'] as bool? ?? false,
      likeCount: json['likeCount'] as int,
      commentCount: json['commentCount'] as int,
      comments: (json['comments'] as List<dynamic>? ?? [])
          .map((item) =>
              MemberNoticeComment.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  MemberNotice copyWith({
    bool? read,
    bool? liked,
    int? likeCount,
    int? commentCount,
    List<MemberNoticeComment>? comments,
  }) {
    return MemberNotice(
      id: id,
      title: title,
      body: body,
      visibility: visibility,
      read: read ?? this.read,
      liked: liked ?? this.liked,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      comments: comments ?? this.comments,
    );
  }
}

class MemberNoticeComment {
  const MemberNoticeComment({
    required this.id,
    required this.memberName,
    required this.body,
    required this.createdAt,
  });

  final String id;
  final String memberName;
  final String body;
  final String createdAt;

  factory MemberNoticeComment.fromJson(Map<String, dynamic> json) {
    return MemberNoticeComment(
      id: json['id'] as String,
      memberName: json['memberName'] as String,
      body: json['body'] as String,
      createdAt: json['createdAt'] as String,
    );
  }
}

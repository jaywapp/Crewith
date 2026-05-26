class AdminClubOverview {
  const AdminClubOverview({
    required this.dashboard,
    required this.members,
    required this.fees,
    required this.events,
    required this.notices,
    required this.joinRequests,
    required this.inviteLinks,
    required this.reminderTargets,
  });

  final AdminDashboard dashboard;
  final List<AdminMember> members;
  final List<AdminFee> fees;
  final List<AdminEvent> events;
  final List<AdminNotice> notices;
  final List<AdminJoinRequest> joinRequests;
  final List<AdminInviteLink> inviteLinks;
  final List<AdminReminderGroup> reminderTargets;

  factory AdminClubOverview.fromJson(Map<String, dynamic> json) {
    return AdminClubOverview(
      dashboard: AdminDashboard.fromJson(json['dashboard'] as Map<String, dynamic>),
      members: (json['members'] as List<dynamic>)
          .map((item) => AdminMember.fromJson(item as Map<String, dynamic>))
          .toList(),
      fees: (json['fees'] as List<dynamic>)
          .map((item) => AdminFee.fromJson(item as Map<String, dynamic>))
          .toList(),
      events: (json['events'] as List<dynamic>)
          .map((item) => AdminEvent.fromJson(item as Map<String, dynamic>))
          .toList(),
      notices: (json['notices'] as List<dynamic>)
          .map((item) => AdminNotice.fromJson(item as Map<String, dynamic>))
          .toList(),
      joinRequests: (json['joinRequests'] as List<dynamic>)
          .map((item) => AdminJoinRequest.fromJson(item as Map<String, dynamic>))
          .toList(),
      inviteLinks: (json['inviteLinks'] as List<dynamic>)
          .map((item) => AdminInviteLink.fromJson(item as Map<String, dynamic>))
          .toList(),
      reminderTargets: (json['reminderTargets'] as List<dynamic>)
          .map((item) => AdminReminderGroup.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AdminDashboard {
  const AdminDashboard({
    required this.totalMemberCount,
    required this.activeMemberCount,
    required this.overdueMemberCount,
    required this.noticeReadRate,
    required this.attendanceRate,
    required this.monthlyFeeCollectionRate,
  });

  final int totalMemberCount;
  final int activeMemberCount;
  final int overdueMemberCount;
  final double noticeReadRate;
  final double attendanceRate;
  final double monthlyFeeCollectionRate;

  factory AdminDashboard.fromJson(Map<String, dynamic> json) {
    return AdminDashboard(
      totalMemberCount: json['totalMemberCount'] as int,
      activeMemberCount: json['activeMemberCount'] as int,
      overdueMemberCount: json['overdueMemberCount'] as int,
      noticeReadRate: (json['noticeReadRate'] as num).toDouble(),
      attendanceRate: (json['attendanceRate'] as num).toDouble(),
      monthlyFeeCollectionRate: (json['monthlyFeeCollectionRate'] as num).toDouble(),
    );
  }
}

class AdminMember {
  const AdminMember({
    required this.id,
    required this.name,
    required this.phoneNumber,
    required this.role,
    required this.memberStatus,
    required this.joinedAt,
    required this.lastFeeStatus,
    this.personalDataDeleteAt,
  });

  final String id;
  final String name;
  final String phoneNumber;
  final String role;
  final String memberStatus;
  final String joinedAt;
  final String lastFeeStatus;
  final String? personalDataDeleteAt;

  factory AdminMember.fromJson(Map<String, dynamic> json) {
    return AdminMember(
      id: json['id'] as String,
      name: json['name'] as String,
      phoneNumber: json['phoneNumber'] as String,
      role: json['role'] as String,
      memberStatus: json['memberStatus'] as String,
      joinedAt: json['joinedAt'] as String,
      lastFeeStatus: json['lastFeeStatus'] as String,
      personalDataDeleteAt: json['personalDataDeleteAt'] as String?,
    );
  }
}

class AdminFee {
  const AdminFee({
    required this.id,
    required this.title,
    required this.feeType,
    required this.amount,
    required this.dueDate,
    required this.targetCount,
    required this.paidCount,
    required this.unpaidCount,
    required this.collectionRate,
    required this.payments,
  });

  final String id;
  final String title;
  final String feeType;
  final int amount;
  final String dueDate;
  final int targetCount;
  final int paidCount;
  final int unpaidCount;
  final int collectionRate;
  final List<AdminFeePayment> payments;

  factory AdminFee.fromJson(Map<String, dynamic> json) {
    return AdminFee(
      id: json['id'] as String,
      title: json['title'] as String,
      feeType: json['feeType'] as String,
      amount: json['amount'] as int,
      dueDate: json['dueDate'] as String,
      targetCount: json['targetCount'] as int,
      paidCount: json['paidCount'] as int,
      unpaidCount: json['unpaidCount'] as int,
      collectionRate: json['collectionRate'] as int,
      payments: (json['payments'] as List<dynamic>)
          .map((item) => AdminFeePayment.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AdminFeePayment {
  const AdminFeePayment({
    required this.memberId,
    required this.memberName,
    required this.status,
  });

  final String memberId;
  final String memberName;
  final String status;

  factory AdminFeePayment.fromJson(Map<String, dynamic> json) {
    return AdminFeePayment(
      memberId: json['memberId'] as String,
      memberName: json['memberName'] as String,
      status: json['status'] as String,
    );
  }
}

class AdminEvent {
  const AdminEvent({
    required this.id,
    required this.title,
    required this.startsAt,
    required this.locationName,
    this.locationAddress,
    this.responseDeadline,
    required this.visibility,
    required this.attendingCount,
    required this.notAttendingCount,
    required this.presentCount,
    required this.lateCount,
    required this.absentCount,
    required this.participants,
  });

  final String id;
  final String title;
  final String startsAt;
  final String locationName;
  final String? locationAddress;
  final String? responseDeadline;
  final String visibility;
  final int attendingCount;
  final int notAttendingCount;
  final int presentCount;
  final int lateCount;
  final int absentCount;
  final List<AdminEventParticipant> participants;

  factory AdminEvent.fromJson(Map<String, dynamic> json) {
    return AdminEvent(
      id: json['id'] as String,
      title: json['title'] as String,
      startsAt: json['startsAt'] as String,
      locationName: json['locationName'] as String,
      locationAddress: json['locationAddress'] as String?,
      responseDeadline: json['responseDeadline'] as String?,
      visibility: json['visibility'] as String,
      attendingCount: json['attendingCount'] as int,
      notAttendingCount: json['notAttendingCount'] as int,
      presentCount: json['presentCount'] as int,
      lateCount: json['lateCount'] as int,
      absentCount: json['absentCount'] as int,
      participants: (json['participants'] as List<dynamic>)
          .map((item) => AdminEventParticipant.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AdminEventParticipant {
  const AdminEventParticipant({
    required this.memberId,
    required this.memberName,
    required this.response,
    required this.attendanceStatus,
    required this.companionCount,
  });

  final String memberId;
  final String memberName;
  final String response;
  final String attendanceStatus;
  final int companionCount;

  factory AdminEventParticipant.fromJson(Map<String, dynamic> json) {
    return AdminEventParticipant(
      memberId: json['memberId'] as String,
      memberName: json['memberName'] as String,
      response: json['response'] as String,
      attendanceStatus: json['attendanceStatus'] as String,
      companionCount: json['companionCount'] as int,
    );
  }
}

class AdminNotice {
  const AdminNotice({
    required this.id,
    required this.title,
    required this.body,
    required this.visibility,
    required this.createdAt,
    required this.readCount,
    required this.unreadCount,
    required this.likeCount,
    required this.readers,
    required this.comments,
  });

  final String id;
  final String title;
  final String body;
  final String visibility;
  final String createdAt;
  final int readCount;
  final int unreadCount;
  final int likeCount;
  final List<AdminNoticeReader> readers;
  final List<AdminNoticeComment> comments;

  factory AdminNotice.fromJson(Map<String, dynamic> json) {
    return AdminNotice(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      visibility: json['visibility'] as String,
      createdAt: json['createdAt'] as String,
      readCount: json['readCount'] as int,
      unreadCount: json['unreadCount'] as int,
      likeCount: json['likeCount'] as int,
      readers: (json['readers'] as List<dynamic>)
          .map((item) => AdminNoticeReader.fromJson(item as Map<String, dynamic>))
          .toList(),
      comments: (json['comments'] as List<dynamic>)
          .map((item) => AdminNoticeComment.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AdminNoticeReader {
  const AdminNoticeReader({
    required this.memberId,
    required this.memberName,
    required this.read,
  });

  final String memberId;
  final String memberName;
  final bool read;

  factory AdminNoticeReader.fromJson(Map<String, dynamic> json) {
    return AdminNoticeReader(
      memberId: json['memberId'] as String,
      memberName: json['memberName'] as String,
      read: json['read'] as bool,
    );
  }
}

class AdminNoticeComment {
  const AdminNoticeComment({
    required this.id,
    required this.memberName,
    required this.body,
    required this.createdAt,
  });

  final String id;
  final String memberName;
  final String body;
  final String createdAt;

  factory AdminNoticeComment.fromJson(Map<String, dynamic> json) {
    return AdminNoticeComment(
      id: json['id'] as String,
      memberName: json['memberName'] as String,
      body: json['body'] as String,
      createdAt: json['createdAt'] as String,
    );
  }
}

class AdminJoinRequest {
  const AdminJoinRequest({
    required this.id,
    required this.applicantName,
    required this.applicantPhone,
    required this.greeting,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String applicantName;
  final String applicantPhone;
  final String greeting;
  final String status;
  final String createdAt;

  factory AdminJoinRequest.fromJson(Map<String, dynamic> json) {
    return AdminJoinRequest(
      id: json['id'] as String,
      applicantName: json['applicantName'] as String,
      applicantPhone: json['applicantPhone'] as String,
      greeting: json['greeting'] as String,
      status: json['status'] as String,
      createdAt: json['createdAt'] as String,
    );
  }
}

class AdminInviteLink {
  const AdminInviteLink({
    required this.id,
    required this.token,
    required this.expiresAt,
    required this.disabled,
  });

  final String id;
  final String token;
  final String expiresAt;
  final bool disabled;

  factory AdminInviteLink.fromJson(Map<String, dynamic> json) {
    return AdminInviteLink(
      id: json['id'] as String,
      token: json['token'] as String,
      expiresAt: json['expiresAt'] as String,
      disabled: json['disabled'] as bool,
    );
  }
}

class AdminReminderGroup {
  const AdminReminderGroup({
    required this.id,
    required this.title,
    required this.description,
    required this.targetCount,
    required this.targets,
  });

  final String id;
  final String title;
  final String description;
  final int targetCount;
  final List<AdminReminderTarget> targets;

  factory AdminReminderGroup.fromJson(Map<String, dynamic> json) {
    return AdminReminderGroup(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      targetCount: json['targetCount'] as int,
      targets: (json['targets'] as List<dynamic>)
          .map((item) => AdminReminderTarget.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AdminReminderTarget {
  const AdminReminderTarget({
    required this.memberId,
    required this.memberName,
    required this.phoneNumber,
    required this.reason,
  });

  final String memberId;
  final String memberName;
  final String phoneNumber;
  final String reason;

  factory AdminReminderTarget.fromJson(Map<String, dynamic> json) {
    return AdminReminderTarget(
      memberId: json['memberId'] as String,
      memberName: json['memberName'] as String,
      phoneNumber: json['phoneNumber'] as String,
      reason: json['reason'] as String,
    );
  }
}

import 'package:flutter/material.dart';

import 'member_api_client.dart';
import 'member_models.dart';
import 'member_ui.dart';
import 'screens/auth_page.dart';
import 'screens/events_page.dart';
import 'screens/fees_page.dart';
import 'screens/home_page.dart';
import 'screens/members_page.dart';
import 'screens/more_page.dart';
import 'screens/notices_page.dart';
import 'screens/notifications_page.dart';

const _defaultMemberId = 'member-03';
const _defaultClubId = 'club-seoul-runners';
const _defaultClubs = [
  ClubSummary(
    clubId: _defaultClubId,
    name: '서울 러너스',
    sportType: '러닝',
    role: 'member',
    memberStatus: 'active',
  ),
];

void main() {
  runApp(const CrewithApp());
}

class CrewithApp extends StatelessWidget {
  const CrewithApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Crewith',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          surface: canvas,
          primary: greenAccent,
          onPrimary: white,
          secondary: starbucksGreen,
          tertiary: gold,
          error: red,
          onSurface: textBlack,
        ),
        scaffoldBackgroundColor: canvas,
        fontFamily: 'Inter',
        navigationBarTheme: const NavigationBarThemeData(
          backgroundColor: white,
          indicatorColor: greenLight,
        ),
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  bool _isAuthenticated = false;
  String _activeMemberId = _defaultMemberId;
  String _activeClubId = _defaultClubId;
  List<ClubSummary> _clubs = _defaultClubs;
  final _api = const MemberApiClient();
  late Future<MemberAppOverview> _overviewFuture;
  late Future<List<MemberDirectoryItem>> _memberDirectoryFuture;
  late Future<List<MemberNotification>> _notificationsFuture;

  @override
  void initState() {
    super.initState();
    _overviewFuture = _fetchOverview();
    _memberDirectoryFuture = _fetchMemberDirectory();
    _notificationsFuture = _fetchNotifications();
  }

  Future<MemberAppOverview> _fetchOverview([String? memberId]) {
    return _api.fetchOverview(
      clubId: _activeClubId,
      memberId: memberId ?? _activeMemberId,
    );
  }

  Future<List<MemberDirectoryItem>> _fetchMemberDirectory([String? memberId]) {
    return _api.fetchMemberDirectory(
      clubId: _activeClubId,
      memberId: memberId ?? _activeMemberId,
    );
  }

  void _refreshOverview() {
    setState(() {
      _overviewFuture = _fetchOverview(_activeMemberId);
      _memberDirectoryFuture = _fetchMemberDirectory(_activeMemberId);
    });
  }

  Future<List<MemberNotification>> _fetchNotifications([String? memberId]) {
    return _api.fetchNotifications(memberId: memberId ?? _activeMemberId);
  }

  void _refreshNotifications() {
    setState(() {
      _notificationsFuture = _fetchNotifications(_activeMemberId);
    });
  }

  Future<String?> _requestOtp(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty) {
      return '휴대폰 번호를 입력하세요.';
    }

    final requested = await _api.requestOtp(phoneNumber);
    return requested
        ? '개발 인증번호 123456을 입력하세요.'
        : '인증번호 요청에 실패했습니다. 개발 인증번호 123456을 사용할 수 있습니다.';
  }

  Future<bool> _verifyOtp(String phoneNumber, String code) async {
    if (code.trim() != '123456') {
      return false;
    }

    setState(() {
      _activeMemberId = _defaultMemberId;
      _isAuthenticated = true;
      _overviewFuture = _fetchOverview(_defaultMemberId);
      _memberDirectoryFuture = _fetchMemberDirectory(_defaultMemberId);
      _notificationsFuture = _fetchNotifications(_defaultMemberId);
    });

    final session = await _api.verifyOtp(phoneNumber, code);
    if (session != null && mounted) {
      final nextClubs = session.clubs.isEmpty ? _defaultClubs : session.clubs;
      final nextClubId = nextClubs.any((club) => club.clubId == _activeClubId)
          ? _activeClubId
          : nextClubs.first.clubId;

      setState(() {
        _activeMemberId = session.memberId;
        _clubs = nextClubs;
        _activeClubId = nextClubId;
        _overviewFuture = _fetchOverview(session.memberId);
        _memberDirectoryFuture = _fetchMemberDirectory(session.memberId);
        _notificationsFuture = _fetchNotifications(session.memberId);
      });

      await _api.registerDevice(
        memberId: session.memberId,
        fcmToken: 'dev-fcm-token-${session.memberId}',
      );
    }

    return true;
  }

  Future<String> _updateProfile(String name, String profileImageUrl) async {
    if (name.trim().isEmpty) {
      return '이름을 입력하세요.';
    }

    final saved = await _api.updateProfile(
      _activeMemberId,
      name: name,
      profileImageUrl: profileImageUrl,
    );

    _replaceOverview((value) => value.updateMemberName(name.trim()));
    _refreshOverview();
    return saved ? '프로필을 저장했습니다.' : '로컬 미리보기 프로필을 저장했습니다.';
  }

  Future<String?> _updateEventResponse(String eventId, String response) async {
    _replaceOverview((value) => value.updateEventResponse(eventId, response));

    final saved = await _api.updateEventResponse(
      clubId: _activeClubId,
      eventId: eventId,
      memberId: _activeMemberId,
      response: response,
    );

    if (saved) {
      _refreshOverview();
      return '참석 의사를 저장했습니다.';
    }

    return '오프라인 미리보기로 반영했습니다.';
  }

  Future<String?> _markNoticeRead(String noticeId) async {
    _replaceOverview((value) => value.markNoticeRead(noticeId));

    final saved = await _api.markNoticeRead(
      clubId: _activeClubId,
      noticeId: noticeId,
      memberId: _activeMemberId,
    );

    if (saved) {
      _refreshOverview();
      return '공지 확인 상태를 저장했습니다.';
    }

    return '오프라인 미리보기로 확인 처리했습니다.';
  }

  Future<String?> _toggleNoticeReaction(String noticeId) async {
    _replaceOverview((value) => value.toggleNoticeReaction(noticeId));

    final saved = await _api.toggleNoticeReaction(
      clubId: _activeClubId,
      noticeId: noticeId,
      memberId: _activeMemberId,
    );

    if (saved) {
      _refreshOverview();
      return '좋아요를 저장했습니다.';
    }

    return '오프라인 미리보기로 좋아요를 반영했습니다.';
  }

  Future<String?> _createNoticeComment(String noticeId, String body) async {
    if (body.trim().isEmpty) {
      return null;
    }

    _replaceOverview(
      (value) => value.addNoticeComment(
        noticeId,
        value.memberName,
        body.trim(),
      ),
    );

    final saved = await _api.createNoticeComment(
      clubId: _activeClubId,
      noticeId: noticeId,
      memberId: _activeMemberId,
      body: body.trim(),
    );

    if (saved) {
      _refreshOverview();
      return '댓글을 등록했습니다.';
    }

    return '오프라인 미리보기로 댓글을 반영했습니다.';
  }

  Future<String?> _markNotificationRead(String notificationId) async {
    setState(() {
      _notificationsFuture = _notificationsFuture.then(
        (notifications) => notifications
            .map(
              (notification) => notification.id == notificationId
                  ? notification.markRead()
                  : notification,
            )
            .toList(),
      );
    });

    final saved = await _api.markNotificationRead(
      memberId: _activeMemberId,
      notificationId: notificationId,
    );

    if (saved) {
      _refreshNotifications();
      return '알림을 읽음 처리했습니다.';
    }

    return '오프라인 미리보기로 읽음 처리했습니다.';
  }

  Future<String> _createJoinRequest(
    String name,
    String phoneNumber,
    String greeting,
  ) async {
    if (name.trim().isEmpty ||
        phoneNumber.trim().isEmpty ||
        greeting.trim().isEmpty) {
      return '이름, 휴대폰 번호, 가입 인사를 입력하세요.';
    }

    final saved = await _api.createJoinRequest(
      clubId: _activeClubId,
      name: name,
      phoneNumber: phoneNumber,
      greeting: greeting,
    );

    return saved ? '가입 신청을 접수했습니다.' : '가입 신청 저장에 실패했습니다.';
  }

  Future<String> _acceptInvite(
    String token,
    String name,
    String phoneNumber,
  ) async {
    if (token.trim().isEmpty ||
        name.trim().isEmpty ||
        phoneNumber.trim().isEmpty) {
      return '초대 코드, 이름, 휴대폰 번호를 입력하세요.';
    }

    final saved = await _api.acceptInvite(
      clubId: _activeClubId,
      token: token,
      name: name,
      phoneNumber: phoneNumber,
    );

    if (saved) {
      _refreshOverview();
      return '초대 코드로 가입했습니다.';
    }

    return '초대 코드 확인에 실패했습니다.';
  }

  void _replaceOverview(
    MemberAppOverview Function(MemberAppOverview value) update,
  ) {
    setState(() {
      _overviewFuture = _overviewFuture.then(update);
    });
  }

  void _changeClub(String clubId) {
    if (clubId == _activeClubId) {
      return;
    }

    setState(() {
      _activeClubId = clubId;
      _overviewFuture = _fetchOverview(_activeMemberId);
      _memberDirectoryFuture = _fetchMemberDirectory(_activeMemberId);
      _notificationsFuture = _fetchNotifications(_activeMemberId);
      _index = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return AuthPage(
        onOtpRequested: _requestOtp,
        onVerified: _verifyOtp,
      );
    }

    return FutureBuilder<MemberAppOverview>(
      future: _overviewFuture,
      builder: (context, snapshot) {
        final overview = snapshot.data ?? MemberAppOverview.seed();
        final activeClub = _clubs.firstWhere(
          (club) => club.clubId == _activeClubId,
          orElse: () => _defaultClubs.first,
        );
        final pages = [
          HomePage(
            overview: overview,
            clubs: _clubs,
            activeClubId: _activeClubId,
            onClubChanged: _changeClub,
          ),
          EventsPage(
            overview: overview,
            onResponseChanged: _updateEventResponse,
          ),
          NoticesPage(
            overview: overview,
            onRead: _markNoticeRead,
            onReactionToggled: _toggleNoticeReaction,
            onCommentCreated: _createNoticeComment,
          ),
          FeesPage(overview: overview),
          FutureBuilder<List<MemberDirectoryItem>>(
            future: _memberDirectoryFuture,
            builder: (context, directorySnapshot) {
              return MembersPage(
                members:
                    directorySnapshot.data ?? MemberDirectoryItem.seedItems,
              );
            },
          ),
          FutureBuilder<List<MemberNotification>>(
            future: _notificationsFuture,
            builder: (context, notificationSnapshot) {
              return NotificationsPage(
                notifications: notificationSnapshot.data ?? const [],
                onRead: _markNotificationRead,
              );
            },
          ),
          MorePage(
            overview: overview,
            clubs: _clubs,
            activeClub: activeClub,
            onClubChanged: _changeClub,
            onProfileSaved: _updateProfile,
            onJoinRequested: _createJoinRequest,
            onInviteAccepted: _acceptInvite,
          ),
        ];

        return Scaffold(
          body: SafeArea(child: pages[_index]),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (value) => setState(() => _index = value),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                label: '홈',
              ),
              NavigationDestination(
                icon: Icon(Icons.event_outlined),
                label: '일정',
              ),
              NavigationDestination(
                icon: Icon(Icons.campaign_outlined),
                label: '공지',
              ),
              NavigationDestination(
                icon: Icon(Icons.payments_outlined),
                label: '회비',
              ),
              NavigationDestination(
                icon: Icon(Icons.groups_outlined),
                label: '구성원',
              ),
              NavigationDestination(
                icon: Icon(Icons.notifications_outlined),
                label: '알림',
              ),
              NavigationDestination(
                icon: Icon(Icons.menu_outlined),
                label: '더보기',
              ),
            ],
          ),
        );
      },
    );
  }
}

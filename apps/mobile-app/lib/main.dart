import 'package:flutter/material.dart';

import 'member_api_client.dart';
import 'member_models.dart';
import 'member_ui.dart';
import 'screens/admin_page.dart';
import 'screens/auth_page.dart';
import 'screens/create_club_page.dart';
import 'screens/events_page.dart';
import 'screens/fees_page.dart';
import 'screens/home_page.dart';
import 'screens/members_page.dart';
import 'screens/more_page.dart';
import 'screens/no_club_page.dart';
import 'screens/notices_page.dart';
import 'screens/notifications_page.dart';
import 'screens/splash_screen.dart';

const _defaultMemberId = 'member-03';
const _defaultClubId = 'club-seoul-runners';

void main() {
  runApp(const CrewithApp());
}

class CrewithApp extends StatelessWidget {
  const CrewithApp({super.key, this.api});

  final MemberApiClient? api;

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
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            shape: const StadiumBorder(),
            backgroundColor: greenAccent,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            shape: const StadiumBorder(),
          ),
        ),
        navigationBarTheme: const NavigationBarThemeData(
          backgroundColor: white,
          indicatorColor: greenLight,
        ),
      ),
      home: SplashScreen(onComplete: (_) => HomeShell(api: api)),
    );
  }
}

class HomeShell extends StatefulWidget {
  HomeShell({super.key, MemberApiClient? api})
      : _api = api ?? const MemberApiClient();

  final MemberApiClient _api;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  bool _isAuthenticated = false;
  bool _hasClub = false;
  String _activeMemberId = _defaultMemberId;
  String _activeClubId = _defaultClubId;
  List<ClubSummary> _clubs = const [];
  MemberApiClient get _api => widget._api;
  late Future<MemberAppOverview> _overviewFuture;
  late Future<List<MemberDirectoryItem>> _memberDirectoryFuture;
  late Future<List<MemberNotification>> _notificationsFuture;

  @override
  void initState() {
    super.initState();
    _overviewFuture = Future.value(const MemberAppOverview(
      clubName: '', sportType: '', memberName: '', fees: [], events: [], notices: [],
    ));
    _memberDirectoryFuture = Future.value(const []);
    _notificationsFuture = Future.value(const []);
  }

  Future<MemberAppOverview> _fetchOverview([String? memberId]) async {
    await WidgetsBinding.instance.endOfFrame;
    return _api.fetchOverview(
      clubId: _activeClubId,
      memberId: memberId ?? _activeMemberId,
    );
  }

  Future<List<MemberDirectoryItem>> _fetchMemberDirectory([String? memberId]) async {
    await WidgetsBinding.instance.endOfFrame;
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

  Future<bool> _login(String phoneNumber, String password) async {
    final session = await _api.login(phoneNumber, password);
    if (session == null || !mounted) return false;

    if (session.clubs.isEmpty) {
      setState(() {
        _activeMemberId = session.memberId;
        _clubs = const [];
        _isAuthenticated = true;
        _hasClub = false;
      });
      return true;
    }

    final nextClubId = session.clubs.any((c) => c.clubId == _activeClubId)
        ? _activeClubId
        : session.clubs.first.clubId;

    setState(() {
      _activeMemberId = session.memberId;
      _clubs = session.clubs;
      _activeClubId = nextClubId;
      _isAuthenticated = true;
      _hasClub = true;
      _overviewFuture = _fetchOverview(session.memberId);
      _memberDirectoryFuture = _fetchMemberDirectory(session.memberId);
      _notificationsFuture = _fetchNotifications(session.memberId);
    });

    await _api.registerDevice(
      memberId: session.memberId,
      fcmToken: 'dev-fcm-token-${session.memberId}',
    );

    return true;
  }

  void _logout() {
    setState(() {
      _isAuthenticated = false;
      _hasClub = false;
      _activeMemberId = _defaultMemberId;
      _activeClubId = _defaultClubId;
      _clubs = const [];
    });
  }

  void _goToCreateClub() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => CreateClubPage(
          api: _api,
          memberId: _activeMemberId,
          onCreated: (clubId) {
            Navigator.of(context).pop();
            setState(() {
              _activeClubId = clubId;
              _clubs = [ClubSummary(clubId: clubId, name: '', sportType: '', role: 'owner', memberStatus: 'active')];
              _hasClub = true;
              _overviewFuture = _fetchOverview(_activeMemberId);
              _memberDirectoryFuture = _fetchMemberDirectory(_activeMemberId);
              _notificationsFuture = _fetchNotifications(_activeMemberId);
            });
          },
        ),
      ),
    );
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
    return saved ? '프로필을 저장했습니다.' : '저장에 실패했습니다. 다시 시도하세요.';
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

    return '연결 실패. 다시 시도하세요.';
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

    return '연결 실패. 다시 시도하세요.';
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

    return '연결 실패. 다시 시도하세요.';
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

    return '연결 실패. 다시 시도하세요.';
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

    return '연결 실패. 다시 시도하세요.';
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

  Future<String> _submitFeedback({
    required String title,
    required String body,
    required String category,
  }) async {
    if (title.trim().isEmpty || body.trim().isEmpty) {
      return '제목과 내용을 모두 입력하세요.';
    }

    final sent = await _api.submitFeedback(
      title: title.trim(),
      body: body.trim(),
      category: category,
      memberId: _activeMemberId,
    );

    return sent ? '피드백이 접수되었습니다. 감사합니다!' : '피드백 전송에 실패했습니다.';
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

  bool _isAdminRole(String role) => role == 'owner' || role == 'operator';

  void _openAdminPage() {
    final activeClub = _clubs.firstWhere(
      (c) => c.clubId == _activeClubId,
      orElse: () => _clubs.first,
    );
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AdminPage(
          clubId: _activeClubId,
          role: activeClub.role,
          api: _api,
        ),
      ),
    );
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
      return AuthPage(onLogin: _login, api: _api);
    }

    if (!_hasClub) {
      return NoClubPage(onLogout: _logout, onCreateClub: _goToCreateClub);
    }

    return FutureBuilder<MemberAppOverview>(
      future: _overviewFuture,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('연결에 실패했습니다.'),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _refreshOverview,
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            ),
          );
        }

        final overview = snapshot.data ?? const MemberAppOverview(
          clubName: '', sportType: '', memberName: '', fees: [], events: [], notices: [],
        );
        final activeClub = _clubs.firstWhere(
          (club) => club.clubId == _activeClubId,
          orElse: () => _clubs.first,
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
              if (directorySnapshot.hasError) {
                return const Center(child: Text('구성원 정보를 불러오지 못했습니다.'));
              }
              return MembersPage(
                members: directorySnapshot.data ?? const [],
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
            onFeedbackSubmitted: _submitFeedback,
            onAdminMode: _isAdminRole(activeClub.role) ? _openAdminPage : null,
          ),
        ];

        return Scaffold(
          body: SafeArea(
            child: IndexedStack(index: _index, children: pages),
          ),
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

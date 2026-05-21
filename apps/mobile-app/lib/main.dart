import 'package:flutter/material.dart';

import 'member_api_client.dart';
import 'member_models.dart';
import 'member_ui.dart';
import 'screens/auth_page.dart';
import 'screens/events_page.dart';
import 'screens/fees_page.dart';
import 'screens/home_page.dart';
import 'screens/more_page.dart';
import 'screens/notices_page.dart';

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

  @override
  void initState() {
    super.initState();
    _overviewFuture = _fetchOverview();
  }

  Future<MemberAppOverview> _fetchOverview([String? memberId]) async {
    return _api.fetchOverview(
      clubId: _activeClubId,
      memberId: memberId ?? _activeMemberId,
    );
  }

  void _refreshOverview() {
    setState(() {
      _overviewFuture = _fetchOverview(_activeMemberId);
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
          ),
          FeesPage(overview: overview),
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

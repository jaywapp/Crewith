import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';

import 'member_models.dart';

const _canvas = Color(0xFFF2F0EB);
const _white = Color(0xFFFFFFFF);
const _textBlack = Color(0xDE000000);
const _textBlackSoft = Color(0x94000000);
const _starbucksGreen = Color(0xFF006241);
const _greenAccent = Color(0xFF00754A);
const _houseGreen = Color(0xFF1E3932);
const _greenLight = Color(0xFFD4E9E2);
const _gold = Color(0xFFCBA258);
const _red = Color(0xFFC82014);

const _apiBaseUrl = String.fromEnvironment(
  'CREWITH_API_BASE_URL',
  defaultValue: 'http://10.0.2.2:4000/api/v1',
);
const _clubId = 'club-seoul-runners';
const _defaultMemberId = 'member-03';

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
          surface: _canvas,
          primary: _greenAccent,
          onPrimary: _white,
          secondary: _starbucksGreen,
          tertiary: _gold,
          error: _red,
          onSurface: _textBlack,
        ),
        scaffoldBackgroundColor: _canvas,
        fontFamily: 'Inter',
        navigationBarTheme: const NavigationBarThemeData(
          backgroundColor: _white,
          indicatorColor: _greenLight,
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
  late Future<MemberAppOverview> _overviewFuture;

  @override
  void initState() {
    super.initState();
    _overviewFuture = _fetchOverview();
  }

  Future<MemberAppOverview> _fetchOverview([String? memberId]) async {
    final uri = Uri.parse(
        '$_apiBaseUrl/clubs/$_clubId/member-app/${memberId ?? _activeMemberId}');
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 2);

    try {
      final request = await client.getUrl(uri);
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      if (response.statusCode != HttpStatus.ok) {
        return MemberAppOverview.seed();
      }

      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return MemberAppOverview.fromJson(json['data'] as Map<String, dynamic>);
    } catch (_) {
      return MemberAppOverview.seed();
    } finally {
      client.close(force: true);
    }
  }

  Future<bool> _sendJson(
      String method, Uri uri, Map<String, Object?> body) async {
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 2);

    try {
      final request = switch (method) {
        'PATCH' => await client.patchUrl(uri),
        'POST' => await client.postUrl(uri),
        _ => await client.postUrl(uri),
      };
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(body));
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
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

    final uri = Uri.parse('$_apiBaseUrl/auth/otp/request');
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 2);

    try {
      final request = await client.postUrl(uri);
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({'phoneNumber': phoneNumber}));
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return '개발 인증번호 123456을 입력하세요.';
      }

      return '인증번호 요청에 실패했습니다. 개발 인증번호 123456을 사용할 수 있습니다.';
    } catch (_) {
      return 'API 연결 전까지 개발 인증번호 123456을 사용할 수 있습니다.';
    } finally {
      client.close(force: true);
    }
  }

  Future<bool> _verifyOtp(String phoneNumber, String code) async {
    if (code.trim() != '123456') {
      return false;
    }

    final uri = Uri.parse('$_apiBaseUrl/auth/otp/verify');
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 2);

    try {
      final request = await client.postUrl(uri);
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({'phoneNumber': phoneNumber, 'code': code}));
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final payload = await response.transform(utf8.decoder).join();
        final json = jsonDecode(payload) as Map<String, dynamic>;
        final data = json['data'] as Map<String, dynamic>;
        final memberId = data['memberId'] as String;

        setState(() {
          _activeMemberId = memberId;
          _isAuthenticated = true;
          _overviewFuture = _fetchOverview(memberId);
        });
        return true;
      }
    } catch (_) {
      // The MVP app keeps a local development path so widget tests and emulator
      // previews can proceed before a real SMS provider is attached.
    } finally {
      client.close(force: true);
    }

    setState(() {
      _activeMemberId = _defaultMemberId;
      _isAuthenticated = true;
      _overviewFuture = _fetchOverview(_defaultMemberId);
    });
    return true;
  }

  Future<String> _updateProfile(String name, String profileImageUrl) async {
    if (name.trim().isEmpty) {
      return '이름을 입력하세요.';
    }

    final uri = Uri.parse('$_apiBaseUrl/members/$_activeMemberId/profile');
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 2);

    try {
      final request = await client.patchUrl(uri);
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({
        'name': name,
        'profileImageUrl': profileImageUrl,
      }));
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        _replaceOverview((value) => value.updateMemberName(name.trim()));
        return '프로필을 저장했습니다.';
      }

      return '프로필 저장에 실패했습니다.';
    } catch (_) {
      _replaceOverview((value) => value.updateMemberName(name.trim()));
      return '로컬 미리보기 프로필을 저장했습니다.';
    } finally {
      client.close(force: true);
    }
  }

  Future<String?> _updateEventResponse(String eventId, String response) async {
    _replaceOverview((value) => value.updateEventResponse(eventId, response));

    final saved = await _sendJson(
      'PATCH',
      Uri.parse('$_apiBaseUrl/clubs/$_clubId/events/$eventId/responses'),
      {
        'memberId': _activeMemberId,
        'response': response,
      },
    );

    if (saved) {
      _refreshOverview();
      return '참석 의사를 저장했습니다.';
    }

    return '오프라인 미리보기로 반영했습니다.';
  }

  Future<String?> _markNoticeRead(String noticeId) async {
    _replaceOverview((value) => value.markNoticeRead(noticeId));

    final saved = await _sendJson(
      'PATCH',
      Uri.parse('$_apiBaseUrl/clubs/$_clubId/notices/$noticeId/read'),
      {'memberId': _activeMemberId},
    );

    if (saved) {
      _refreshOverview();
      return '공지 확인 상태를 저장했습니다.';
    }

    return '오프라인 미리보기로 확인 처리했습니다.';
  }

  Future<String> _createJoinRequest(
      String name, String phoneNumber, String greeting) async {
    if (name.trim().isEmpty ||
        phoneNumber.trim().isEmpty ||
        greeting.trim().isEmpty) {
      return '이름, 휴대폰 번호, 가입 인사를 입력하세요.';
    }

    final saved = await _sendJson(
      'POST',
      Uri.parse('$_apiBaseUrl/clubs/$_clubId/join-requests'),
      {
        'applicantName': name,
        'applicantPhone': phoneNumber,
        'greeting': greeting,
      },
    );

    return saved ? '가입 신청을 접수했습니다.' : '가입 신청 저장에 실패했습니다.';
  }

  Future<String> _acceptInvite(
      String token, String name, String phoneNumber) async {
    if (token.trim().isEmpty ||
        name.trim().isEmpty ||
        phoneNumber.trim().isEmpty) {
      return '초대 코드, 이름, 휴대폰 번호를 입력하세요.';
    }

    final saved = await _sendJson(
      'POST',
      Uri.parse(
          '$_apiBaseUrl/clubs/$_clubId/invite-links/${token.trim()}/accept'),
      {
        'applicantName': name,
        'applicantPhone': phoneNumber,
      },
    );

    if (saved) {
      _refreshOverview();
      return '초대 코드로 가입했습니다.';
    }

    return '초대 코드 확인에 실패했습니다.';
  }

  void _replaceOverview(
      MemberAppOverview Function(MemberAppOverview value) update) {
    setState(() {
      _overviewFuture = _overviewFuture.then(update);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return _AuthPage(
        onOtpRequested: _requestOtp,
        onVerified: _verifyOtp,
      );
    }

    return FutureBuilder<MemberAppOverview>(
      future: _overviewFuture,
      builder: (context, snapshot) {
        final overview = snapshot.data ?? MemberAppOverview.seed();
        final pages = [
          _HomePage(overview: overview),
          _EventsPage(
            overview: overview,
            onResponseChanged: _updateEventResponse,
          ),
          _NoticesPage(
            overview: overview,
            onRead: _markNoticeRead,
          ),
          _FeesPage(overview: overview),
          _MorePage(
            overview: overview,
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
                  icon: Icon(Icons.home_outlined), label: '홈'),
              NavigationDestination(
                  icon: Icon(Icons.event_outlined), label: '일정'),
              NavigationDestination(
                  icon: Icon(Icons.campaign_outlined), label: '공지'),
              NavigationDestination(
                  icon: Icon(Icons.payments_outlined), label: '회비'),
              NavigationDestination(
                  icon: Icon(Icons.menu_outlined), label: '더보기'),
            ],
          ),
        );
      },
    );
  }
}

class _AuthPage extends StatefulWidget {
  const _AuthPage({
    required this.onOtpRequested,
    required this.onVerified,
  });

  final Future<String?> Function(String phoneNumber) onOtpRequested;
  final Future<bool> Function(String phoneNumber, String code) onVerified;

  @override
  State<_AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<_AuthPage> {
  final _phoneController = TextEditingController(text: '010-1234-1003');
  final _codeController = TextEditingController(text: '123456');
  String? _message;
  bool _busy = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    setState(() => _busy = true);
    final message = await widget.onOtpRequested(_phoneController.text);
    if (!mounted) {
      return;
    }

    setState(() {
      _message = message;
      _busy = false;
    });
  }

  Future<void> _verifyOtp() async {
    setState(() => _busy = true);
    final verified =
        await widget.onVerified(_phoneController.text, _codeController.text);
    if (!mounted) {
      return;
    }

    setState(() {
      _message = verified ? null : '인증번호를 확인하세요.';
      _busy = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 24),
            Text(
              '휴대폰 인증',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: _starbucksGreen,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '모임 회원 정보를 불러오기 위해 휴대폰 번호를 확인합니다.',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: _textBlackSoft),
            ),
            const SizedBox(height: 24),
            _InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _TextInput(
                    controller: _phoneController,
                    label: '휴대폰 번호',
                    keyboardType: TextInputType.phone,
                  ),
                  _TextInput(
                    controller: _codeController,
                    label: '인증번호',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _busy ? null : _requestOtp,
                          child: const Text('인증번호 받기'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          onPressed: _busy ? null : _verifyOtp,
                          child: const Text('인증 확인'),
                        ),
                      ),
                    ],
                  ),
                  if (_message != null) ...[
                    const SizedBox(height: 12),
                    Text(_message!, style: const TextStyle(color: _houseGreen)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomePage extends StatelessWidget {
  const _HomePage({required this.overview});

  final MemberAppOverview overview;

  @override
  Widget build(BuildContext context) {
    final nextEvent = overview.events.first;
    final unpaidCount =
        overview.fees.where((fee) => fee.status == 'unpaid').length;
    final unreadCount = overview.notices.where((notice) => !notice.read).length;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          overview.clubName,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: _starbucksGreen,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.16,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          '${overview.memberName} · 일반회원',
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: _textBlackSoft),
        ),
        const SizedBox(height: 24),
        _SummaryCard(
          label: '다음 일정',
          title: nextEvent.title,
          body:
              '${_formatDate(nextEvent.startsAt)} · ${nextEvent.locationName}',
        ),
        const SizedBox(height: 12),
        _SummaryCard(
          label: '내 회비',
          title: unpaidCount == 0 ? '미납 없음' : '미납 $unpaidCount건',
          body: unpaidCount == 0
              ? '현재 확인 필요한 회비가 없습니다.'
              : '운영진이 납부 상태를 확인하면 반영됩니다.',
        ),
        const SizedBox(height: 12),
        _SummaryCard(
          label: '미확인 공지',
          title: '$unreadCount건',
          body: unreadCount == 0 ? '모든 공지를 확인했습니다.' : '공지 탭에서 열람하면 확인 처리됩니다.',
        ),
      ],
    );
  }
}

class _EventsPage extends StatelessWidget {
  const _EventsPage({
    required this.overview,
    required this.onResponseChanged,
  });

  final MemberAppOverview overview;
  final Future<String?> Function(String eventId, String response)
      onResponseChanged;

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: '일정',
      subtitle: '참석 의사를 선택하고 출석 상태를 확인하세요.',
      children: overview.events.map((event) {
        return _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CardHeader(
                  label: _formatDate(event.startsAt), title: event.title),
              Text(
                  '${event.locationName} · ${event.locationAddress ?? '주소 없음'}'),
              const SizedBox(height: 14),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'attending', label: Text('참석')),
                  ButtonSegment(value: 'not_attending', label: Text('불참')),
                ],
                selected: {event.response},
                onSelectionChanged: (value) async {
                  final message =
                      await onResponseChanged(event.id, value.first);
                  if (context.mounted && message != null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(message)),
                    );
                  }
                },
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Chip(
                      label:
                          '출석 상태 ${_attendanceLabel(event.attendanceStatus)}'),
                  _Chip(label: '동반 ${event.companionCount}명'),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _NoticesPage extends StatelessWidget {
  const _NoticesPage({
    required this.overview,
    required this.onRead,
  });

  final MemberAppOverview overview;
  final Future<String?> Function(String noticeId) onRead;

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: '공지',
      subtitle: '공지 열람 상태와 반응을 확인하세요.',
      children: overview.notices.map((notice) {
        return _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CardHeader(
                label:
                    notice.visibility == 'operators_only' ? '운영진 공지' : '전체 공지',
                title: notice.title,
              ),
              Text(notice.body),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Chip(label: notice.read ? '확인 완료' : '미확인'),
                  _Chip(label: '좋아요 ${notice.likeCount}'),
                  _Chip(label: '댓글 ${notice.commentCount}'),
                ],
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: notice.read
                    ? null
                    : () async {
                        final message = await onRead(notice.id);
                        if (context.mounted && message != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(message)),
                          );
                        }
                      },
                child: Text(notice.read ? '확인됨' : '확인 처리'),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _FeesPage extends StatelessWidget {
  const _FeesPage({required this.overview});

  final MemberAppOverview overview;

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: '회비',
      subtitle: '내 납부 상태를 확인하세요.',
      children: overview.fees.map((fee) {
        return _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CardHeader(label: fee.dueDate, title: fee.title),
              Text('${_formatCurrency(fee.amount)}원'),
              const SizedBox(height: 12),
              _StatusPill(label: _feeLabel(fee.status), status: fee.status),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _MorePage extends StatefulWidget {
  const _MorePage({
    required this.overview,
    required this.onProfileSaved,
    required this.onJoinRequested,
    required this.onInviteAccepted,
  });

  final MemberAppOverview overview;
  final Future<String> Function(String name, String profileImageUrl)
      onProfileSaved;
  final Future<String> Function(
      String name, String phoneNumber, String greeting) onJoinRequested;
  final Future<String> Function(String token, String name, String phoneNumber)
      onInviteAccepted;

  @override
  State<_MorePage> createState() => _MorePageState();
}

class _MorePageState extends State<_MorePage> {
  late final TextEditingController _profileNameController;
  final _profileImageController = TextEditingController();
  final _joinNameController = TextEditingController();
  final _joinPhoneController = TextEditingController();
  final _joinGreetingController = TextEditingController();
  final _inviteNameController = TextEditingController();
  final _invitePhoneController = TextEditingController();
  final _inviteCodeController = TextEditingController(text: 'CREWITH-RUN-30');
  String? _resultMessage;
  bool _profileSaving = false;
  bool _joinSaving = false;
  bool _inviteSaving = false;

  @override
  void initState() {
    super.initState();
    _profileNameController =
        TextEditingController(text: widget.overview.memberName);
  }

  @override
  void dispose() {
    _profileNameController.dispose();
    _profileImageController.dispose();
    _joinNameController.dispose();
    _joinPhoneController.dispose();
    _joinGreetingController.dispose();
    _inviteNameController.dispose();
    _invitePhoneController.dispose();
    _inviteCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: '더보기',
      subtitle: '내 모임 정보와 가입 신청',
      children: [
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CardHeader(
                  label: widget.overview.sportType,
                  title: widget.overview.clubName),
              Text('${widget.overview.memberName}님은 현재 일반회원으로 참여 중입니다.'),
            ],
          ),
        ),
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _CardHeader(label: '내 정보', title: '프로필'),
              _TextInput(controller: _profileNameController, label: '이름'),
              _TextInput(
                  controller: _profileImageController, label: '프로필 사진 URL'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _profileSaving
                    ? null
                    : () async {
                        setState(() => _profileSaving = true);
                        final message = await widget.onProfileSaved(
                          _profileNameController.text,
                          _profileImageController.text,
                        );
                        if (!mounted) {
                          return;
                        }

                        setState(() {
                          _resultMessage = message;
                          _profileSaving = false;
                        });
                      },
                child: const Text('프로필 저장'),
              ),
            ],
          ),
        ),
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _CardHeader(label: '공개 모임', title: '가입 신청'),
              _TextInput(controller: _joinNameController, label: '이름'),
              _TextInput(controller: _joinPhoneController, label: '휴대폰 번호'),
              _TextInput(controller: _joinGreetingController, label: '가입 인사'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _joinSaving
                    ? null
                    : () async {
                        setState(() => _joinSaving = true);
                        final message = await widget.onJoinRequested(
                          _joinNameController.text,
                          _joinPhoneController.text,
                          _joinGreetingController.text,
                        );
                        if (!mounted) {
                          return;
                        }

                        setState(() {
                          _resultMessage = message;
                          _joinSaving = false;
                        });
                      },
                child: const Text('가입 신청'),
              ),
            ],
          ),
        ),
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _CardHeader(label: '비공개 모임', title: '초대 코드로 가입'),
              _TextInput(controller: _inviteNameController, label: '이름'),
              _TextInput(controller: _invitePhoneController, label: '휴대폰 번호'),
              _TextInput(controller: _inviteCodeController, label: '초대 코드'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _inviteSaving
                    ? null
                    : () async {
                        setState(() => _inviteSaving = true);
                        final message = await widget.onInviteAccepted(
                          _inviteCodeController.text,
                          _inviteNameController.text,
                          _invitePhoneController.text,
                        );
                        if (!mounted) {
                          return;
                        }

                        setState(() {
                          _resultMessage = message;
                          _inviteSaving = false;
                        });
                      },
                child: const Text('초대 코드 확인'),
              ),
            ],
          ),
        ),
        if (_resultMessage != null) _InfoCard(child: Text(_resultMessage!)),
      ],
    );
  }
}

class _TextInput extends StatelessWidget {
  const _TextInput({
    required this.controller,
    required this.label,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          border: const OutlineInputBorder(),
          labelText: label,
        ),
      ),
    );
  }
}

class _PageScaffold extends StatelessWidget {
  const _PageScaffold({
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: _starbucksGreen,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.16,
              ),
        ),
        const SizedBox(height: 4),
        Text(subtitle,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: _textBlackSoft)),
        const SizedBox(height: 20),
        ...children.expand((child) => [child, const SizedBox(height: 12)]),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.title,
    required this.body,
  });

  final String label;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return _InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .labelSmall
                  ?.copyWith(color: _textBlackSoft)),
          const SizedBox(height: 10),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: _houseGreen,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.16,
                ),
          ),
          const SizedBox(height: 6),
          Text(body),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Color(0x24000000), blurRadius: 0.5),
          BoxShadow(
              color: Color(0x3D000000), blurRadius: 1, offset: Offset(0, 1)),
        ],
      ),
      child: child,
    );
  }
}

class _CardHeader extends StatelessWidget {
  const _CardHeader({required this.label, required this.title});

  final String label;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: _textBlackSoft)),
        const SizedBox(height: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: _houseGreen,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: _greenLight,
        borderRadius: BorderRadius.circular(50),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(label,
            style: const TextStyle(
                color: _houseGreen, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.status});

  final String label;
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = status == 'paid'
        ? _greenLight
        : status == 'exempt'
            ? const Color(0xFFEDEBE9)
            : const Color(0xFFFAF6EE);
    final textColor = status == 'paid'
        ? _houseGreen
        : status == 'exempt'
            ? _textBlackSoft
            : _gold;

    return Align(
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(
            color: color, borderRadius: BorderRadius.circular(50)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Text(label,
              style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }
}

String _formatDate(String value) {
  return value.length >= 16
      ? value.substring(5, 16).replaceFirst('T', ' ')
      : value;
}

String _formatCurrency(int value) {
  final text = value.toString();
  final buffer = StringBuffer();

  for (var i = 0; i < text.length; i += 1) {
    final remaining = text.length - i;
    buffer.write(text[i]);
    if (remaining > 1 && remaining % 3 == 1) {
      buffer.write(',');
    }
  }

  return buffer.toString();
}

String _feeLabel(String status) {
  return switch (status) {
    'paid' => '납부',
    'exempt' => '면제',
    _ => '미납',
  };
}

String _attendanceLabel(String status) {
  return switch (status) {
    'present' => '출석',
    'late' => '지각',
    _ => '결석',
  };
}

import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';

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
const _memberId = 'member-03';

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
  late Future<MemberAppOverview> _overviewFuture;

  @override
  void initState() {
    super.initState();
    _overviewFuture = _fetchOverview();
  }

  Future<MemberAppOverview> _fetchOverview() async {
    final uri = Uri.parse('$_apiBaseUrl/clubs/$_clubId/member-app/$_memberId');
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 2);

    try {
      final request = await client.getUrl(uri);
      final response = await request.close().timeout(const Duration(seconds: 3));

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

  void _replaceOverview(MemberAppOverview Function(MemberAppOverview value) update) {
    setState(() {
      _overviewFuture = _overviewFuture.then(update);
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<MemberAppOverview>(
      future: _overviewFuture,
      builder: (context, snapshot) {
        final overview = snapshot.data ?? MemberAppOverview.seed();
        final pages = [
          _HomePage(overview: overview),
          _EventsPage(
            overview: overview,
            onResponseChanged: (eventId, response) {
              _replaceOverview((value) => value.updateEventResponse(eventId, response));
            },
          ),
          _NoticesPage(
            overview: overview,
            onRead: (noticeId) {
              _replaceOverview((value) => value.markNoticeRead(noticeId));
            },
          ),
          _FeesPage(overview: overview),
          _MorePage(overview: overview),
        ];

        return Scaffold(
          body: SafeArea(child: pages[_index]),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (value) => setState(() => _index = value),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), label: '홈'),
              NavigationDestination(icon: Icon(Icons.event_outlined), label: '일정'),
              NavigationDestination(icon: Icon(Icons.campaign_outlined), label: '공지'),
              NavigationDestination(icon: Icon(Icons.payments_outlined), label: '회비'),
              NavigationDestination(icon: Icon(Icons.menu_outlined), label: '더보기'),
            ],
          ),
        );
      },
    );
  }
}

class _HomePage extends StatelessWidget {
  const _HomePage({required this.overview});

  final MemberAppOverview overview;

  @override
  Widget build(BuildContext context) {
    final nextEvent = overview.events.first;
    final unpaidCount = overview.fees.where((fee) => fee.status == 'unpaid').length;
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
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: _textBlackSoft),
        ),
        const SizedBox(height: 24),
        _SummaryCard(
          label: '다음 일정',
          title: nextEvent.title,
          body: '${_formatDate(nextEvent.startsAt)} · ${nextEvent.locationName}',
        ),
        const SizedBox(height: 12),
        _SummaryCard(
          label: '내 회비',
          title: unpaidCount == 0 ? '미납 없음' : '미납 $unpaidCount건',
          body: unpaidCount == 0 ? '현재 확인 필요한 회비가 없습니다.' : '운영진이 납부 상태를 확인하면 반영됩니다.',
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
  final void Function(String eventId, String response) onResponseChanged;

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
              _CardHeader(label: _formatDate(event.startsAt), title: event.title),
              Text('${event.locationName} · ${event.locationAddress ?? '주소 없음'}'),
              const SizedBox(height: 14),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'attending', label: Text('참석')),
                  ButtonSegment(value: 'not_attending', label: Text('불참')),
                ],
                selected: {event.response},
                onSelectionChanged: (value) => onResponseChanged(event.id, value.first),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Chip(label: '출석 상태 ${_attendanceLabel(event.attendanceStatus)}'),
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
  final void Function(String noticeId) onRead;

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
                label: notice.visibility == 'operators_only' ? '운영진 공지' : '전체 공지',
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
                onPressed: notice.read ? null : () => onRead(notice.id),
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
  const _MorePage({required this.overview});

  final MemberAppOverview overview;

  @override
  State<_MorePage> createState() => _MorePageState();
}

class _MorePageState extends State<_MorePage> {
  final _joinNameController = TextEditingController();
  final _joinPhoneController = TextEditingController();
  final _joinGreetingController = TextEditingController();
  final _inviteNameController = TextEditingController();
  final _invitePhoneController = TextEditingController();
  final _inviteCodeController = TextEditingController(text: 'CREWITH-RUN-30');
  String? _resultMessage;

  @override
  void dispose() {
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
              _CardHeader(label: widget.overview.sportType, title: widget.overview.clubName),
              Text('${widget.overview.memberName}님은 현재 일반회원으로 참여 중입니다.'),
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
                onPressed: () {
                  setState(() {
                    _resultMessage = '${_joinNameController.text.isEmpty ? '신청자' : _joinNameController.text}님의 가입 신청을 접수했습니다.';
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
                onPressed: () {
                  setState(() {
                    _resultMessage = '${_inviteCodeController.text} 초대 코드를 확인했습니다.';
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
  const _TextInput({required this.controller, required this.label});

  final TextEditingController controller;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
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
        Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: _textBlackSoft)),
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
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: _textBlackSoft)),
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
          BoxShadow(color: Color(0x3D000000), blurRadius: 1, offset: Offset(0, 1)),
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
        Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: _textBlackSoft)),
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
        child: Text(label, style: const TextStyle(color: _houseGreen, fontWeight: FontWeight.w700)),
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
    final color = status == 'paid' ? _greenLight : status == 'exempt' ? const Color(0xFFEDEBE9) : const Color(0xFFFAF6EE);
    final textColor = status == 'paid' ? _houseGreen : status == 'exempt' ? _textBlackSoft : _gold;

    return Align(
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(50)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        ),
      ),
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
      fees: (json['fees'] as List<dynamic>).map((item) => MemberFee.fromJson(item as Map<String, dynamic>)).toList(),
      events: (json['events'] as List<dynamic>).map((item) => MemberEvent.fromJson(item as Map<String, dynamic>)).toList(),
      notices: (json['notices'] as List<dynamic>).map((item) => MemberNotice.fromJson(item as Map<String, dynamic>)).toList(),
    );
  }

  factory MemberAppOverview.seed() {
    return const MemberAppOverview(
      clubName: '서울 러너스',
      sportType: '러닝',
      memberName: '박도윤',
      fees: [
        MemberFee(id: 'fee-2026-05', title: '5월 월회비', amount: 30000, dueDate: '2026-05-25', status: 'unpaid'),
        MemberFee(id: 'fee-event-01', title: '춘계 단체복 비용', amount: 45000, dueDate: '2026-05-30', status: 'unpaid'),
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
      events: events.map((event) => event.id == eventId ? event.copyWith(response: response) : event).toList(),
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
      notices: notices.map((notice) => notice.id == noticeId ? notice.copyWith(read: true) : notice).toList(),
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

String _formatDate(String value) {
  return value.length >= 16 ? value.substring(5, 16).replaceFirst('T', ' ') : value;
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

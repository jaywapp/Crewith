import 'package:flutter/material.dart';

const _canvas = Color(0xFFF2F0EB);
const _white = Color(0xFFFFFFFF);
const _textBlack = Color(0xDE000000);
const _textBlackSoft = Color(0x94000000);
const _starbucksGreen = Color(0xFF006241);
const _greenAccent = Color(0xFF00754A);
const _houseGreen = Color(0xFF1E3932);
const _red = Color(0xFFC82014);

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
          tertiary: Color(0xFFCBA258),
          error: _red,
          onSurface: _textBlack,
        ),
        scaffoldBackgroundColor: _canvas,
        fontFamily: 'Inter',
        navigationBarTheme: const NavigationBarThemeData(
          backgroundColor: _white,
          indicatorColor: Color(0xFFD4E9E2),
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

  static const _pages = [
    _HomePage(),
    _PlaceholderPage(title: '일정'),
    _PlaceholderPage(title: '공지'),
    _PlaceholderPage(title: '회비'),
    _PlaceholderPage(title: '더보기'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _pages[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: '홈'),
          NavigationDestination(icon: Icon(Icons.event_outlined), label: '일정'),
          NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            label: '공지',
          ),
          NavigationDestination(
            icon: Icon(Icons.payments_outlined),
            label: '회비',
          ),
          NavigationDestination(icon: Icon(Icons.menu_outlined), label: '더보기'),
        ],
      ),
    );
  }
}

class _HomePage extends StatelessWidget {
  const _HomePage();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          '토요 풋살',
          style: Theme.of(
            context,
          ).textTheme.headlineMedium?.copyWith(
                color: _starbucksGreen,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.16,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          '일반회원 · 다음 일정과 회비 상태를 확인하세요.',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: _textBlackSoft),
        ),
        const SizedBox(height: 24),
        const _SummaryCard(
          label: '다음 일정',
          title: '토요일 오전 10:00',
          body: 'OO 풋살장 · 참석 응답 마감 전',
        ),
        const SizedBox(height: 12),
        const _SummaryCard(
          label: '내 회비',
          title: '미납 1건',
          body: '5월 월회비 납부 확인이 필요합니다.',
        ),
        const SizedBox(height: 12),
        const _SummaryCard(
          label: '미확인 공지',
          title: '이번 주 경기 안내',
          body: '상세를 열면 자동 확인 처리됩니다.',
        ),
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Color(0x24000000), blurRadius: 0.5),
          BoxShadow(
            color: Color(0x3D000000),
            blurRadius: 1,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: _textBlackSoft),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(
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

class _PlaceholderPage extends StatelessWidget {
  const _PlaceholderPage({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(title, style: Theme.of(context).textTheme.headlineMedium),
    );
  }
}

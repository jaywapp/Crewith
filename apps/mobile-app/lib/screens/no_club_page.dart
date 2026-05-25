import 'package:flutter/material.dart';

import '../member_ui.dart';

class NoClubPage extends StatelessWidget {
  const NoClubPage({super.key, required this.onLogout, this.onCreateClub});

  final VoidCallback onLogout;
  final VoidCallback? onCreateClub;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Crewith',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: starbucksGreen,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 24),
                const Text(
                  '아직 참여 중인 모임이 없습니다.\n초대 링크로 참여하거나 새 모임을 만드세요.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                if (onCreateClub != null) ...[
                  FilledButton(
                    onPressed: onCreateClub,
                    child: const Text('모임 만들기'),
                  ),
                  const SizedBox(height: 12),
                ],
                OutlinedButton(
                  onPressed: onLogout,
                  child: const Text('로그아웃'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

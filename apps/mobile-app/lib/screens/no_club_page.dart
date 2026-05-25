import 'package:flutter/material.dart';

import '../member_ui.dart';

class NoClubPage extends StatelessWidget {
  const NoClubPage({super.key, required this.onLogout});

  final VoidCallback onLogout;

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
                  '아직 참여 중인 모임이 없습니다.\n관리자의 초대를 기다려주세요.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
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

import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_ui.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key, required this.api});

  final MemberApiClient api;

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _phoneController = TextEditingController();
  String? _errorMessage;
  bool _busy = false;
  bool _success = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      setState(() => _errorMessage = '전화번호를 입력하세요.');
      return;
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    final ok = await widget.api.resetPassword(phone);

    if (!mounted) return;

    if (ok) {
      setState(() {
        _busy = false;
        _success = true;
      });
    } else {
      setState(() {
        _busy = false;
        _errorMessage = '등록되지 않은 전화번호입니다.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('비밀번호 찾기')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (_success) ...[
              InfoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check_circle_outline, color: starbucksGreen, size: 40),
                    const SizedBox(height: 12),
                    Text(
                      '비밀번호가 초기화되었습니다.',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '전화번호 뒷 4자리로 로그인하세요.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: textBlackSoft),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('로그인으로 돌아가기'),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Text(
                '비밀번호 찾기',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: starbucksGreen,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                '가입 시 등록한 전화번호를 입력하면\n비밀번호가 전화번호 뒷 4자리로 초기화됩니다.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: textBlackSoft),
              ),
              const SizedBox(height: 24),
              InfoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextInput(
                      controller: _phoneController,
                      label: '전화번호',
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _busy ? null : _submit,
                        child: const Text('비밀번호 초기화'),
                      ),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: red),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

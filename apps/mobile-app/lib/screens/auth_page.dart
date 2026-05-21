import 'package:flutter/material.dart';

import '../member_ui.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({
    super.key,
    required this.onOtpRequested,
    required this.onVerified,
  });

  final Future<String?> Function(String phoneNumber) onOtpRequested;
  final Future<bool> Function(String phoneNumber, String code) onVerified;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
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
                    color: starbucksGreen,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '모임 회원 정보를 불러오기 위해 휴대폰 번호를 확인합니다.',
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
                    label: '휴대폰 번호',
                    keyboardType: TextInputType.phone,
                  ),
                  TextInput(
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
                    Text(_message!, style: const TextStyle(color: houseGreen)),
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

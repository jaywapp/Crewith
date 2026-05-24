import 'package:flutter/material.dart';

import '../member_ui.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key, required this.onLogin});

  final Future<bool> Function(String phoneNumber, String password) onLogin;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _errorMessage;
  bool _busy = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    final success = await widget.onLogin(
      _phoneController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    setState(() {
      _busy = false;
      _errorMessage = success ? null : '전화번호 또는 비밀번호를 확인하세요.';
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
              '로그인',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: starbucksGreen,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '전화번호와 비밀번호를 입력하세요.',
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
                  TextInput(
                    controller: _passwordController,
                    label: '비밀번호',
                    obscureText: true,
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: const Text('로그인'),
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
        ),
      ),
    );
  }
}

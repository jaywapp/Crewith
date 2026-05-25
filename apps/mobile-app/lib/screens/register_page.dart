import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_ui.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key, required this.api});

  final MemberApiClient api;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _birthDateController = TextEditingController();
  String? _errorMessage;
  bool _busy = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _birthDateController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();

    if (name.isEmpty || phone.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = '이름, 전화번호, 비밀번호를 입력하세요.');
      return;
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    final memberId = await widget.api.register(
      name: name,
      phoneNumber: phone,
      password: password,
      birthDate: _birthDateController.text.trim().isEmpty
          ? null
          : _birthDateController.text.trim(),
    );

    if (!mounted) return;

    setState(() => _busy = false);

    if (memberId != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('가입 완료. 로그인해주세요.')),
      );
      Navigator.of(context).pop();
    } else {
      setState(() => _errorMessage = '이미 사용 중인 전화번호입니다.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('회원가입')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextInput(
                    controller: _nameController,
                    label: '이름',
                  ),
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
                  TextInput(
                    controller: _birthDateController,
                    label: '생년월일 (선택)',
                    hint: 'YYYY-MM-DD',
                    keyboardType: TextInputType.datetime,
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: const Text('가입하기'),
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

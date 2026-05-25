import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_ui.dart';

class CreateClubPage extends StatefulWidget {
  const CreateClubPage({
    super.key,
    required this.api,
    required this.memberId,
    required this.onCreated,
  });

  final MemberApiClient api;
  final String memberId;
  final void Function(String clubId) onCreated;

  @override
  State<CreateClubPage> createState() => _CreateClubPageState();
}

class _CreateClubPageState extends State<CreateClubPage> {
  final _nameController = TextEditingController();
  final _sportTypeController = TextEditingController();
  String? _errorMessage;
  bool _busy = false;

  @override
  void dispose() {
    _nameController.dispose();
    _sportTypeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final sportType = _sportTypeController.text.trim();

    if (name.isEmpty || sportType.isEmpty) {
      setState(() => _errorMessage = '모임 이름과 종목을 입력하세요.');
      return;
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    final result = await widget.api.createClub(
      name: name,
      sportType: sportType,
      ownerMemberId: widget.memberId,
    );

    if (!mounted) return;

    if (result != null) {
      widget.onCreated(result['clubId']!);
    } else {
      setState(() {
        _busy = false;
        _errorMessage = '모임 만들기에 실패했습니다. 다시 시도하세요.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('모임 만들기')),
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
                    label: '모임 이름',
                    hint: '서울 러너스',
                  ),
                  TextInput(
                    controller: _sportTypeController,
                    label: '종목',
                    hint: '러닝',
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: const Text('모임 만들기'),
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

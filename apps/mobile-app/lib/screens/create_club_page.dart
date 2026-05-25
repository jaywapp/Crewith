import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_ui.dart';

const _sportCategories = [
  '🏃 러닝',
  '⚽ 축구',
  '🏀 농구',
  '🎾 테니스',
  '🏊 수영',
  '🚴 자전거',
  '🥊 복싱',
  '⛳ 골프',
  '🏐 배구',
  '🏋️ 헬스',
  '🧘 요가',
  '🎿 스키',
];

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
  String _sportType = '';
  String? _errorMessage;
  bool _busy = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final sportType = _sportType.trim();

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
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Autocomplete<String>(
                      optionsBuilder: (TextEditingValue textEditingValue) {
                        if (textEditingValue.text.isEmpty) {
                          return _sportCategories;
                        }
                        return _sportCategories.where(
                          (option) => option.toLowerCase().contains(
                                textEditingValue.text.toLowerCase(),
                              ),
                        );
                      },
                      onSelected: (String selection) {
                        setState(() => _sportType = selection);
                      },
                      fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                        return TextField(
                          controller: controller,
                          focusNode: focusNode,
                          onChanged: (value) => _sportType = value,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            labelText: '종목',
                            hintText: '러닝 또는 직접 입력',
                          ),
                        );
                      },
                      optionsViewBuilder: (context, onSelected, options) {
                        return Align(
                          alignment: Alignment.topLeft,
                          child: Material(
                            elevation: 4,
                            borderRadius: BorderRadius.circular(8),
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxHeight: 220),
                              child: ListView.builder(
                                padding: EdgeInsets.zero,
                                shrinkWrap: true,
                                itemCount: options.length,
                                itemBuilder: (context, index) {
                                  final option = options.elementAt(index);
                                  return ListTile(
                                    dense: true,
                                    title: Text(option),
                                    onTap: () => onSelected(option),
                                  );
                                },
                              ),
                            ),
                          ),
                        );
                      },
                    ),
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

import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class MorePage extends StatefulWidget {
  const MorePage({
    super.key,
    required this.overview,
    required this.onProfileSaved,
    required this.onJoinRequested,
    required this.onInviteAccepted,
  });

  final MemberAppOverview overview;
  final Future<String> Function(String name, String profileImageUrl)
      onProfileSaved;
  final Future<String> Function(
    String name,
    String phoneNumber,
    String greeting,
  ) onJoinRequested;
  final Future<String> Function(String token, String name, String phoneNumber)
      onInviteAccepted;

  @override
  State<MorePage> createState() => _MorePageState();
}

class _MorePageState extends State<MorePage> {
  late final TextEditingController _profileNameController;
  final _profileImageController = TextEditingController();
  final _joinNameController = TextEditingController();
  final _joinPhoneController = TextEditingController();
  final _joinGreetingController = TextEditingController();
  final _inviteNameController = TextEditingController();
  final _invitePhoneController = TextEditingController();
  final _inviteCodeController = TextEditingController(text: 'CREWITH-RUN-30');
  String? _resultMessage;
  bool _profileSaving = false;
  bool _joinSaving = false;
  bool _inviteSaving = false;

  @override
  void initState() {
    super.initState();
    _profileNameController =
        TextEditingController(text: widget.overview.memberName);
  }

  @override
  void dispose() {
    _profileNameController.dispose();
    _profileImageController.dispose();
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
    return PageScaffold(
      title: '더보기',
      subtitle: '내 모임 정보와 가입 신청',
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(
                label: widget.overview.sportType,
                title: widget.overview.clubName,
              ),
              Text('${widget.overview.memberName}님은 현재 일반회원으로 참여 중입니다.'),
            ],
          ),
        ),
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '내 정보', title: '프로필'),
              TextInput(controller: _profileNameController, label: '이름'),
              TextInput(
                controller: _profileImageController,
                label: '프로필 사진 URL',
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _profileSaving
                    ? null
                    : () async {
                        setState(() => _profileSaving = true);
                        final message = await widget.onProfileSaved(
                          _profileNameController.text,
                          _profileImageController.text,
                        );
                        if (!mounted) {
                          return;
                        }

                        setState(() {
                          _resultMessage = message;
                          _profileSaving = false;
                        });
                      },
                child: const Text('프로필 저장'),
              ),
            ],
          ),
        ),
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '공개 모임', title: '가입 신청'),
              TextInput(controller: _joinNameController, label: '이름'),
              TextInput(controller: _joinPhoneController, label: '휴대폰 번호'),
              TextInput(controller: _joinGreetingController, label: '가입 인사'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _joinSaving
                    ? null
                    : () async {
                        setState(() => _joinSaving = true);
                        final message = await widget.onJoinRequested(
                          _joinNameController.text,
                          _joinPhoneController.text,
                          _joinGreetingController.text,
                        );
                        if (!mounted) {
                          return;
                        }

                        setState(() {
                          _resultMessage = message;
                          _joinSaving = false;
                        });
                      },
                child: const Text('가입 신청'),
              ),
            ],
          ),
        ),
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '비공개 모임', title: '초대 코드로 가입'),
              TextInput(controller: _inviteNameController, label: '이름'),
              TextInput(controller: _invitePhoneController, label: '휴대폰 번호'),
              TextInput(controller: _inviteCodeController, label: '초대 코드'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _inviteSaving
                    ? null
                    : () async {
                        setState(() => _inviteSaving = true);
                        final message = await widget.onInviteAccepted(
                          _inviteCodeController.text,
                          _inviteNameController.text,
                          _invitePhoneController.text,
                        );
                        if (!mounted) {
                          return;
                        }

                        setState(() {
                          _resultMessage = message;
                          _inviteSaving = false;
                        });
                      },
                child: const Text('초대 코드 확인'),
              ),
            ],
          ),
        ),
        if (_resultMessage != null) InfoCard(child: Text(_resultMessage!)),
      ],
    );
  }
}

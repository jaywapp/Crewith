import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class MorePage extends StatefulWidget {
  const MorePage({
    super.key,
    required this.overview,
    required this.clubs,
    required this.activeClub,
    required this.onClubChanged,
    required this.onProfileSaved,
    required this.onJoinRequested,
    required this.onInviteAccepted,
    required this.onFeedbackSubmitted,
  });

  final MemberAppOverview overview;
  final List<ClubSummary> clubs;
  final ClubSummary activeClub;
  final ValueChanged<String> onClubChanged;
  final Future<String> Function(String name, String profileImageUrl)
      onProfileSaved;
  final Future<String> Function(
    String name,
    String phoneNumber,
    String greeting,
  ) onJoinRequested;
  final Future<String> Function(String token, String name, String phoneNumber)
      onInviteAccepted;
  final Future<String> Function({
    required String title,
    required String body,
    required String category,
  }) onFeedbackSubmitted;

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
  final _feedbackTitleController = TextEditingController();
  final _feedbackBodyController = TextEditingController();
  String _feedbackCategory = 'bug';
  String? _resultMessage;
  bool _profileSaving = false;
  bool _joinSaving = false;
  bool _inviteSaving = false;
  bool _feedbackSaving = false;

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
    _feedbackTitleController.dispose();
    _feedbackBodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '⚙️ 더보기',
      subtitle: '내 모임 정보와 가입 신청을 관리합니다.',
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(
                label: roleLabel(widget.activeClub.role),
                title: widget.overview.clubName,
              ),
              Text('${widget.overview.memberName}님이 현재 참여 중인 모임입니다.'),
            ],
          ),
        ),
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '내 모임', title: '모임 전환'),
              DropdownButtonFormField<String>(
                value: widget.activeClub.clubId,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: '활성 모임',
                ),
                items: widget.clubs
                    .map(
                      (club) => DropdownMenuItem(
                        value: club.clubId,
                        child: Text('${club.name} · ${club.sportType}'),
                      ),
                    )
                    .toList(),
                onChanged: widget.clubs.length <= 1
                    ? null
                    : (value) {
                        if (value != null) {
                          widget.onClubChanged(value);
                        }
                      },
              ),
              if (widget.clubs.length <= 1) ...[
                const SizedBox(height: 10),
                const Text('가입된 모임이 하나라 전환할 모임이 없습니다.'),
              ],
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
                child: const Text('💾 프로필 저장'),
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
                child: const Text('✉️ 가입 신청'),
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
                child: const Text('🎫 초대 코드 확인'),
              ),
            ],
          ),
        ),
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '💬 피드백', title: '✉️ 개발팀에 의견 보내기'),
              TextInput(
                controller: _feedbackTitleController,
                label: '제목',
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: TextField(
                  controller: _feedbackBodyController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '내용',
                  ),
                ),
              ),
              DropdownButtonFormField<String>(
                value: _feedbackCategory,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: '유형',
                  isDense: true,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                items: const [
                  DropdownMenuItem(value: 'bug', child: Text('버그 신고')),
                  DropdownMenuItem(value: 'improvement', child: Text('개선 제안')),
                  DropdownMenuItem(value: 'other', child: Text('기타')),
                ],
                onChanged: (value) {
                  if (value != null) setState(() => _feedbackCategory = value);
                },
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: _feedbackSaving
                      ? null
                      : () async {
                          setState(() => _feedbackSaving = true);
                          final message = await widget.onFeedbackSubmitted(
                            title: _feedbackTitleController.text,
                            body: _feedbackBodyController.text,
                            category: _feedbackCategory,
                          );
                          if (!mounted) return;
                          _feedbackTitleController.clear();
                          _feedbackBodyController.clear();
                          setState(() {
                            _resultMessage = message;
                            _feedbackSaving = false;
                          });
                        },
                  child: const Text('📨 피드백 보내기'),
                ),
              ),
            ],
          ),
        ),
        if (_resultMessage != null) InfoCard(child: Text(_resultMessage!)),
      ],
    );
  }
}

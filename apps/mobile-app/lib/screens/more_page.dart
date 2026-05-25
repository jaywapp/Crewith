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
    required this.onEventCreated,
    required this.onMemberCreated,
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
  final Future<String> Function({
    required String title,
    required String startsAt,
    required String locationName,
    String? locationAddress,
  }) onEventCreated;
  final Future<String> Function({
    required String name,
    required String phoneNumber,
    required String role,
    String? password,
  }) onMemberCreated;

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
  final _eventTitleController = TextEditingController();
  final _eventLocationController = TextEditingController();
  final _eventAddressController = TextEditingController();
  final _newMemberNameController = TextEditingController();
  final _newMemberPhoneController = TextEditingController();
  final _newMemberPasswordController = TextEditingController();
  String _feedbackCategory = 'bug';
  String _newMemberRole = 'member';
  DateTime? _eventStartsAt;
  String? _resultMessage;
  bool _profileSaving = false;
  bool _joinSaving = false;
  bool _inviteSaving = false;
  bool _feedbackSaving = false;
  bool _eventSaving = false;
  bool _addMemberSaving = false;

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
    _eventTitleController.dispose();
    _eventLocationController.dispose();
    _eventAddressController.dispose();
    _newMemberNameController.dispose();
    _newMemberPhoneController.dispose();
    _newMemberPasswordController.dispose();
    super.dispose();
  }

  Future<void> _pickEventDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time == null || !mounted) return;
    setState(() {
      _eventStartsAt = DateTime(
        date.year, date.month, date.day,
        time.hour, time.minute,
      );
    });
  }

  String _formatDateTime(DateTime dt) {
    final mo = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    final h = dt.hour.toString().padLeft(2, '0');
    final mi = dt.minute.toString().padLeft(2, '0');
    return '${dt.year}-$mo-$d $h:$mi';
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
                          final messenger = ScaffoldMessenger.of(context);
                          final message = await widget.onFeedbackSubmitted(
                            title: _feedbackTitleController.text,
                            body: _feedbackBodyController.text,
                            category: _feedbackCategory,
                          );
                          if (!mounted) return;
                          _feedbackTitleController.clear();
                          _feedbackBodyController.clear();
                          messenger.showSnackBar(
                            SnackBar(content: Text(message)),
                          );
                          setState(() => _feedbackSaving = false);
                        },
                  child: const Text('📨 피드백 보내기'),
                ),
              ),
            ],
          ),
        ),
        if (widget.activeClub.role == 'owner' ||
            widget.activeClub.role == 'operator') ...[
          InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CardHeader(label: '🛠 관리자', title: '일정 생성'),
                TextInput(controller: _eventTitleController, label: '일정명'),
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    onTap: _pickEventDateTime,
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        labelText: '일시',
                      ),
                      child: Text(
                        _eventStartsAt != null
                            ? _formatDateTime(_eventStartsAt!)
                            : '날짜/시간을 선택하세요',
                        style: TextStyle(
                          color: _eventStartsAt == null ? textBlackSoft : null,
                        ),
                      ),
                    ),
                  ),
                ),
                TextInput(controller: _eventLocationController, label: '장소'),
                TextInput(
                  controller: _eventAddressController,
                  label: '주소 (선택)',
                ),
                const SizedBox(height: 2),
                FilledButton(
                  onPressed: _eventSaving
                      ? null
                      : () async {
                          setState(() => _eventSaving = true);
                          final messenger = ScaffoldMessenger.of(context);
                          final message = await widget.onEventCreated(
                            title: _eventTitleController.text,
                            startsAt: _eventStartsAt != null
                                ? _eventStartsAt!
                                    .toIso8601String()
                                    .substring(0, 16)
                                : '',
                            locationName: _eventLocationController.text,
                            locationAddress: _eventAddressController.text,
                          );
                          if (!mounted) return;
                          if (message.startsWith('✅')) {
                            _eventTitleController.clear();
                            _eventLocationController.clear();
                            _eventAddressController.clear();
                            setState(() => _eventStartsAt = null);
                          }
                          messenger.showSnackBar(
                            SnackBar(content: Text(message)),
                          );
                          setState(() => _eventSaving = false);
                        },
                  child: const Text('📅 일정 추가'),
                ),
              ],
            ),
          ),
          InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CardHeader(label: '🛠 관리자', title: '회원 추가'),
                TextInput(controller: _newMemberNameController, label: '이름'),
                TextInput(
                  controller: _newMemberPhoneController,
                  label: '휴대폰 번호',
                  keyboardType: TextInputType.phone,
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: DropdownButtonFormField<String>(
                    value: _newMemberRole,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: '역할',
                    ),
                    items: const [
                      DropdownMenuItem(value: 'member', child: Text('일반회원')),
                      DropdownMenuItem(value: 'operator', child: Text('운영진')),
                      DropdownMenuItem(value: 'owner', child: Text('모임장')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _newMemberRole = value);
                      }
                    },
                  ),
                ),
                TextInput(
                  controller: _newMemberPasswordController,
                  label: '초기 비밀번호 (선택)',
                ),
                FilledButton(
                  onPressed: _addMemberSaving
                      ? null
                      : () async {
                          setState(() => _addMemberSaving = true);
                          final messenger = ScaffoldMessenger.of(context);
                          final message = await widget.onMemberCreated(
                            name: _newMemberNameController.text,
                            phoneNumber: _newMemberPhoneController.text,
                            role: _newMemberRole,
                            password: _newMemberPasswordController.text,
                          );
                          if (!mounted) return;
                          if (message.startsWith('✅')) {
                            _newMemberNameController.clear();
                            _newMemberPhoneController.clear();
                            _newMemberPasswordController.clear();
                            setState(() => _newMemberRole = 'member');
                          }
                          messenger.showSnackBar(
                            SnackBar(content: Text(message)),
                          );
                          setState(() => _addMemberSaving = false);
                        },
                  child: const Text('👤 회원 추가'),
                ),
              ],
            ),
          ),
        ],
        if (_resultMessage != null) InfoCard(child: Text(_resultMessage!)),
      ],
    );
  }
}

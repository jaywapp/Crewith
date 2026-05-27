import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_models.dart';
import '../member_ui.dart';

class EventsPage extends StatelessWidget {
  const EventsPage({
    super.key,
    required this.overview,
    required this.onResponseChanged,
    this.isAdmin = false,
    this.clubId,
    this.role,
    this.api,
    this.onRefresh,
  });

  final MemberAppOverview overview;
  final Future<String?> Function(String eventId, String response)
      onResponseChanged;
  final bool isAdmin;
  final String? clubId;
  final String? role;
  final MemberApiClient? api;
  final VoidCallback? onRefresh;

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _EventFormSheet(
        clubId: clubId!,
        role: role!,
        api: api!,
        onSuccess: () {
          Navigator.of(context).pop();
          onRefresh?.call();
        },
      ),
    );
  }

  void _showEditSheet(BuildContext context, MemberEvent event) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _EventFormSheet(
        clubId: clubId!,
        role: role!,
        api: api!,
        initialEvent: event,
        onSuccess: () {
          Navigator.of(context).pop();
          onRefresh?.call();
        },
      ),
    );
  }

  Future<void> _deleteEvent(BuildContext context, MemberEvent event) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('일정 삭제'),
        content: Text('"${event.title}" 일정을 삭제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await api!.adminDeleteEvent(
      clubId: clubId!,
      role: role!,
      eventId: event.id,
    );
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '일정을 삭제했습니다.' : '삭제에 실패했습니다.')),
    );
    if (ok) onRefresh?.call();
  }

  @override
  Widget build(BuildContext context) {
    final eventCards = overview.events.map((event) {
      return InfoCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: CardHeader(
                    label: formatDate(event.startsAt),
                    title: event.title,
                  ),
                ),
                if (isAdmin)
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert),
                    onSelected: (action) {
                      if (action == 'edit') _showEditSheet(context, event);
                      if (action == 'delete') _deleteEvent(context, event);
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(value: 'edit', child: Text('수정')),
                      PopupMenuItem(
                        value: 'delete',
                        child: Text(
                          '삭제',
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            Text(
                '${event.locationName} · ${event.locationAddress ?? '주소 없음'}'),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                OutlinedButton(
                  onPressed: null,
                  child: Text(
                    event.attendanceStatus == 'present'
                        ? '✅ 출석'
                        : event.attendanceStatus == 'late'
                            ? '⏰ 지각'
                            : '❌ 결석',
                  ),
                ),
                FilledButton(
                  onPressed: () async {
                    final next = event.response == 'attending'
                        ? 'not_attending'
                        : 'attending';
                    final message = await onResponseChanged(event.id, next);
                    if (context.mounted && message != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(message)),
                      );
                    }
                  },
                  child: Text(
                      event.response == 'attending' ? '❌ 불참' : '✅ 참석'),
                ),
              ],
            ),
          ],
        ),
      );
    }).toList();

    final pageContent = PageScaffold(
      title: '📅 일정',
      subtitle: isAdmin
          ? '일정을 관리하고 참석 의사를 확인하세요.'
          : '참석 의사를 선택하고 출석 상태를 확인하세요.',
      children: [
        ...eventCards,
        if (isAdmin) const SizedBox(height: 72),
      ],
    );

    if (!isAdmin) return pageContent;

    return Stack(
      children: [
        pageContent,
        Positioned(
          bottom: 16,
          right: 16,
          child: FloatingActionButton.extended(
            heroTag: 'events-fab',
            onPressed: () => _showCreateSheet(context),
            backgroundColor: greenAccent,
            foregroundColor: white,
            icon: const Icon(Icons.add),
            label: const Text('일정 추가'),
          ),
        ),
      ],
    );
  }
}

// ─── Event Form Sheet ────────────────────────────────────────────────────────

class _EventFormSheet extends StatefulWidget {
  const _EventFormSheet({
    required this.clubId,
    required this.role,
    required this.api,
    required this.onSuccess,
    this.initialEvent,
  });

  final String clubId;
  final String role;
  final MemberApiClient api;
  final VoidCallback onSuccess;
  final MemberEvent? initialEvent;

  @override
  State<_EventFormSheet> createState() => _EventFormSheetState();
}

class _EventFormSheetState extends State<_EventFormSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _startsAtCtrl;
  late final TextEditingController _locationCtrl;
  late final TextEditingController _addressCtrl;
  String _visibility = 'all_members';
  bool _saving = false;

  bool get _isEdit => widget.initialEvent != null;

  @override
  void initState() {
    super.initState();
    final e = widget.initialEvent;
    _titleCtrl = TextEditingController(text: e?.title ?? '');
    _startsAtCtrl = TextEditingController(
      text: e != null
          ? (e.startsAt.length >= 16
              ? e.startsAt.substring(0, 16)
              : e.startsAt)
          : '',
    );
    _locationCtrl = TextEditingController(text: e?.locationName ?? '');
    _addressCtrl = TextEditingController(text: e?.locationAddress ?? '');
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _startsAtCtrl.dispose();
    _locationCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty ||
        _startsAtCtrl.text.trim().isEmpty ||
        _locationCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('일정명, 일시, 장소를 입력하세요.')),
      );
      return;
    }

    setState(() => _saving = true);
    final bool ok;
    if (_isEdit) {
      ok = await widget.api.adminUpdateEvent(
        clubId: widget.clubId,
        role: widget.role,
        eventId: widget.initialEvent!.id,
        title: _titleCtrl.text.trim(),
        startsAt: _startsAtCtrl.text.trim(),
        locationName: _locationCtrl.text.trim(),
        locationAddress: _addressCtrl.text.trim(),
        visibility: _visibility,
      );
    } else {
      ok = await widget.api.adminCreateEvent(
        clubId: widget.clubId,
        role: widget.role,
        title: _titleCtrl.text.trim(),
        startsAt: _startsAtCtrl.text.trim(),
        locationName: _locationCtrl.text.trim(),
        locationAddress: _addressCtrl.text.trim(),
        visibility: _visibility,
      );
    }

    if (!mounted) return;
    setState(() => _saving = false);

    if (ok) {
      widget.onSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? '수정에 실패했습니다.' : '추가에 실패했습니다.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        top: 20,
        left: 16,
        right: 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _isEdit ? '✏️ 일정 수정' : '📅 일정 추가',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: houseGreen,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            TextInput(controller: _titleCtrl, label: '일정명'),
            TextInput(
              controller: _startsAtCtrl,
              label: '일시 (YYYY-MM-DDTHH:MM)',
              hint: '2026-06-01T10:00',
            ),
            TextInput(controller: _locationCtrl, label: '장소'),
            TextInput(controller: _addressCtrl, label: '주소 (선택)'),
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: DropdownButtonFormField<String>(
                value: _visibility,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: '공개 범위',
                ),
                items: const [
                  DropdownMenuItem(
                      value: 'all_members', child: Text('전체 회원')),
                  DropdownMenuItem(
                      value: 'operators_only', child: Text('운영진만')),
                ],
                onChanged: (v) {
                  if (v != null) setState(() => _visibility = v);
                },
              ),
            ),
            const SizedBox(height: 4),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_isEdit ? '수정 저장' : '일정 추가'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

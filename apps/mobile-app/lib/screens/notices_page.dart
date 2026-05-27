import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_models.dart';
import '../member_ui.dart';

class NoticesPage extends StatefulWidget {
  const NoticesPage({
    super.key,
    required this.overview,
    required this.onRead,
    required this.onReactionToggled,
    required this.onCommentCreated,
    this.isAdmin = false,
    this.clubId,
    this.role,
    this.api,
    this.onRefresh,
  });

  final MemberAppOverview overview;
  final Future<String?> Function(String noticeId) onRead;
  final Future<String?> Function(String noticeId) onReactionToggled;
  final Future<String?> Function(String noticeId, String body) onCommentCreated;
  final bool isAdmin;
  final String? clubId;
  final String? role;
  final MemberApiClient? api;
  final VoidCallback? onRefresh;

  @override
  State<NoticesPage> createState() => _NoticesPageState();
}

class _NoticesPageState extends State<NoticesPage> {
  final Map<String, TextEditingController> _commentControllers = {};
  final Set<String> _commentSavingIds = {};

  @override
  void dispose() {
    for (final controller in _commentControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _showCreateSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _NoticeFormSheet(
        clubId: widget.clubId!,
        role: widget.role!,
        api: widget.api!,
        onSuccess: () {
          Navigator.of(context).pop();
          widget.onRefresh?.call();
        },
      ),
    );
  }

  void _showEditSheet(MemberNotice notice) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _NoticeFormSheet(
        clubId: widget.clubId!,
        role: widget.role!,
        api: widget.api!,
        initialNotice: notice,
        onSuccess: () {
          Navigator.of(context).pop();
          widget.onRefresh?.call();
        },
      ),
    );
  }

  Future<void> _deleteNotice(MemberNotice notice) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('공지 삭제'),
        content: Text('"${notice.title}" 공지를 삭제하시겠습니까?'),
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
    if (confirmed != true || !mounted) return;

    final ok = await widget.api!.adminDeleteNotice(
      clubId: widget.clubId!,
      role: widget.role!,
      noticeId: notice.id,
    );
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '공지를 삭제했습니다.' : '삭제에 실패했습니다.')),
    );
    if (ok) widget.onRefresh?.call();
  }

  @override
  Widget build(BuildContext context) {
    final noticeCards = widget.overview.notices.map((notice) {
      final controller = _commentControllers.putIfAbsent(
        notice.id,
        TextEditingController.new,
      );
      final commentSaving = _commentSavingIds.contains(notice.id);

      return InfoCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: CardHeader(
                    label: notice.visibility == 'operators_only'
                        ? '운영진 공지'
                        : '전체 공지',
                    title: notice.title,
                  ),
                ),
                if (widget.isAdmin)
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert),
                    onSelected: (action) {
                      if (action == 'edit') _showEditSheet(notice);
                      if (action == 'delete') _deleteNotice(notice);
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
            Text(notice.body),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                InfoChip(label: notice.read ? '✅ 확인 완료' : '⭕ 미확인'),
                InfoChip(label: '👍 ${notice.likeCount}'),
                InfoChip(label: '💬 ${notice.commentCount}'),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                FilledButton(
                  onPressed: notice.read
                      ? null
                      : () async {
                          final message = await widget.onRead(notice.id);
                          if (context.mounted && message != null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(message)),
                            );
                          }
                        },
                  child: Text(notice.read ? '✅ 확인됨' : '✔️ 확인 처리'),
                ),
                OutlinedButton.icon(
                  onPressed: () async {
                    final message =
                        await widget.onReactionToggled(notice.id);
                    if (context.mounted && message != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(message)),
                      );
                    }
                  },
                  icon: Icon(
                    notice.liked
                        ? Icons.thumb_up
                        : Icons.thumb_up_alt_outlined,
                  ),
                  label: Text(notice.liked ? '좋아요 취소' : '좋아요'),
                ),
              ],
            ),
            if (notice.comments.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...notice.comments.map(
                (comment) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: greenLight,
                        foregroundColor: houseGreen,
                        child: Text(
                          comment.memberName.characters.first,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${comment.memberName}  ${formatDate(comment.createdAt)}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: textBlackSoft,
                              ),
                            ),
                            Text(comment.body),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: '댓글을 입력하세요',
                      isDense: true,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: commentSaving
                      ? null
                      : () async {
                          final body = controller.text.trim();
                          if (body.isEmpty) return;

                          final messenger = ScaffoldMessenger.of(context);
                          setState(
                              () => _commentSavingIds.add(notice.id));
                          final message = await widget.onCommentCreated(
                            notice.id,
                            body,
                          );
                          if (!mounted) return;

                          if (message != null) {
                            messenger.showSnackBar(
                              SnackBar(content: Text(message)),
                            );
                          }
                          controller.clear();
                          setState(
                              () => _commentSavingIds.remove(notice.id));
                        },
                  child: const Text('✉️ 등록'),
                ),
              ],
            ),
          ],
        ),
      );
    }).toList();

    final pageContent = PageScaffold(
      title: '📢 공지',
      subtitle: widget.isAdmin
          ? '공지를 관리하고 열람 상태를 확인하세요.'
          : '공지 열람 상태와 반응을 확인하세요.',
      children: [
        ...noticeCards,
        if (widget.isAdmin) const SizedBox(height: 72),
      ],
    );

    if (!widget.isAdmin) return pageContent;

    return Stack(
      children: [
        pageContent,
        Positioned(
          bottom: 16,
          right: 16,
          child: FloatingActionButton.extended(
            heroTag: 'notices-fab',
            onPressed: _showCreateSheet,
            backgroundColor: greenAccent,
            foregroundColor: white,
            icon: const Icon(Icons.add),
            label: const Text('공지 작성'),
          ),
        ),
      ],
    );
  }
}

// ─── Notice Form Sheet ────────────────────────────────────────────────────────

class _NoticeFormSheet extends StatefulWidget {
  const _NoticeFormSheet({
    required this.clubId,
    required this.role,
    required this.api,
    required this.onSuccess,
    this.initialNotice,
  });

  final String clubId;
  final String role;
  final MemberApiClient api;
  final VoidCallback onSuccess;
  final MemberNotice? initialNotice;

  @override
  State<_NoticeFormSheet> createState() => _NoticeFormSheetState();
}

class _NoticeFormSheetState extends State<_NoticeFormSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _bodyCtrl;
  late String _visibility;
  bool _saving = false;

  bool get _isEdit => widget.initialNotice != null;

  @override
  void initState() {
    super.initState();
    final n = widget.initialNotice;
    _titleCtrl = TextEditingController(text: n?.title ?? '');
    _bodyCtrl = TextEditingController(text: n?.body ?? '');
    _visibility = n?.visibility ?? 'all_members';
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty || _bodyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('제목과 내용을 입력하세요.')),
      );
      return;
    }

    setState(() => _saving = true);
    final bool ok;
    if (_isEdit) {
      ok = await widget.api.adminUpdateNotice(
        clubId: widget.clubId,
        role: widget.role,
        noticeId: widget.initialNotice!.id,
        title: _titleCtrl.text.trim(),
        body: _bodyCtrl.text.trim(),
        visibility: _visibility,
      );
    } else {
      ok = await widget.api.adminCreateNotice(
        clubId: widget.clubId,
        role: widget.role,
        title: _titleCtrl.text.trim(),
        body: _bodyCtrl.text.trim(),
        visibility: _visibility,
      );
    }

    if (!mounted) return;
    setState(() => _saving = false);

    if (ok) {
      widget.onSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? '수정에 실패했습니다.' : '작성에 실패했습니다.')),
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
              _isEdit ? '✏️ 공지 수정' : '📢 공지 작성',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: houseGreen,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            TextInput(controller: _titleCtrl, label: '제목'),
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: TextField(
                controller: _bodyCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: '내용',
                ),
              ),
            ),
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
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_isEdit ? '수정 저장' : '공지 작성'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

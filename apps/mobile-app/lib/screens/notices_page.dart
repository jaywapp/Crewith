import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class NoticesPage extends StatefulWidget {
  const NoticesPage({
    super.key,
    required this.overview,
    required this.onRead,
    required this.onReactionToggled,
    required this.onCommentCreated,
  });

  final MemberAppOverview overview;
  final Future<String?> Function(String noticeId) onRead;
  final Future<String?> Function(String noticeId) onReactionToggled;
  final Future<String?> Function(String noticeId, String body) onCommentCreated;

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

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '공지',
      subtitle: '공지 열람 상태와 반응을 확인하세요.',
      children: widget.overview.notices.map((notice) {
        final controller = _commentControllers.putIfAbsent(
          notice.id,
          TextEditingController.new,
        );
        final commentSaving = _commentSavingIds.contains(notice.id);

        return InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(
                label: notice.visibility == 'operators_only' ? '운영진 공지' : '전체 공지',
                title: notice.title,
              ),
              Text(notice.body),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  InfoChip(label: notice.read ? '확인 완료' : '미확인'),
                  InfoChip(label: '좋아요 ${notice.likeCount}'),
                  InfoChip(label: '댓글 ${notice.commentCount}'),
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
                    child: Text(notice.read ? '확인됨' : '확인 처리'),
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
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text('${comment.memberName}: ${comment.body}'),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextInput(controller: controller, label: '댓글 입력'),
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton(
                  onPressed: commentSaving
                      ? null
                      : () async {
                          final body = controller.text.trim();
                          if (body.isEmpty) {
                            return;
                          }

                          final messenger = ScaffoldMessenger.of(context);
                          setState(() => _commentSavingIds.add(notice.id));
                          final message = await widget.onCommentCreated(
                            notice.id,
                            body,
                          );
                          if (!mounted) {
                            return;
                          }

                          if (message != null) {
                            messenger.showSnackBar(
                              SnackBar(content: Text(message)),
                            );
                          }
                          controller.clear();
                          setState(() => _commentSavingIds.remove(notice.id));
                        },
                  child: const Text('댓글 등록'),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

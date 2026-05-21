import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class NoticesPage extends StatelessWidget {
  const NoticesPage({
    super.key,
    required this.overview,
    required this.onRead,
  });

  final MemberAppOverview overview;
  final Future<String?> Function(String noticeId) onRead;

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '공지',
      subtitle: '공지 열람 상태와 반응을 확인하세요.',
      children: overview.notices.map((notice) {
        return InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(
                label:
                    notice.visibility == 'operators_only' ? '운영진 공지' : '전체 공지',
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
              FilledButton(
                onPressed: notice.read
                    ? null
                    : () async {
                        final message = await onRead(notice.id);
                        if (context.mounted && message != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(message)),
                          );
                        }
                      },
                child: Text(notice.read ? '확인됨' : '확인 처리'),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

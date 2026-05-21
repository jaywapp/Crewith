import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({
    super.key,
    required this.notifications,
    required this.onRead,
  });

  final List<MemberNotification> notifications;
  final Future<String?> Function(String notificationId) onRead;

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '알림',
      subtitle: '회비, 일정, 공지 리마인더를 확인하세요.',
      children: [
        if (notifications.isEmpty)
          const InfoCard(child: Text('아직 수신된 알림이 없습니다.')),
        ...notifications.map(
          (notification) => InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CardHeader(
                  label: notificationLabel(notification.type),
                  title: notification.title,
                ),
                Text(notification.body),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    InfoChip(label: notification.read ? '읽음' : '안 읽음'),
                    InfoChip(label: formatDate(notification.createdAt)),
                  ],
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: notification.read
                      ? null
                      : () async {
                          final message = await onRead(notification.id);
                          if (context.mounted && message != null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(message)),
                            );
                          }
                        },
                  child: Text(notification.read ? '읽음 처리됨' : '읽음 처리'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

String notificationLabel(String type) {
  return switch (type) {
    'fee_overdue' => '회비',
    'notice_unread' => '공지',
    'event_no_response' => '일정',
    _ => '알림',
  };
}

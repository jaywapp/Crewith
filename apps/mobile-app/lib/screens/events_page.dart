import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class EventsPage extends StatelessWidget {
  const EventsPage({
    super.key,
    required this.overview,
    required this.onResponseChanged,
  });

  final MemberAppOverview overview;
  final Future<String?> Function(String eventId, String response)
      onResponseChanged;

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '📅 일정',
      subtitle: '참석 의사를 선택하고 출석 상태를 확인하세요.',
      children: overview.events.map((event) {
        return InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(label: formatDate(event.startsAt), title: event.title),
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
      }).toList(),
    );
  }
}

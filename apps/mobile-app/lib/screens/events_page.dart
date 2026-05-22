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
      title: '일정',
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
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'attending', label: Text('참석')),
                  ButtonSegment(value: 'not_attending', label: Text('불참')),
                ],
                selected: {event.response},
                onSelectionChanged: (value) async {
                  final message =
                      await onResponseChanged(event.id, value.first);
                  if (context.mounted && message != null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(message)),
                    );
                  }
                },
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  InfoChip(
                      label:
                          '출석 상태 ${attendanceLabel(event.attendanceStatus)}'),
                  InfoChip(label: '동반 ${event.companionCount}명'),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
